const {partition, sortBy} = require('../Array');

const EventRegistrar = require('./eventregistrar.js');

class EffectEngine {
    constructor(game) {
        this.game = game;
        this.events = new EventRegistrar(game, this);
        this.events.register([
            'onCardMoved', 
            'onCardTakenControl', 
            'onCardBlankToggled', 
            'onShootoutPhaseFinished', 
            'onShootoutRoundFinished', 
            'onPhaseEnded', 
            'onAtEndOfPhase', 
            'onRoundEnded',
            'onPlayWindowClosed'
        ]);
        this.effects = [];
        this.customDurationEvents = [];
        this.effectsBeingRecalculated = [];
    }

    add(effect) {
        if(!effect.isInActiveLocation()) {
            return;
        }

        this.effects.push(effect);
        this.effects = sortBy(this.effects, effect => effect.order);
        effect.addTargets(this.getTargets());
        if(effect.duration === 'custom' || effect.until) {
            this.registerCustomDurationEvents(effect);
        }
    }

    addSimultaneous(effects) {
        let sortedEffects = sortBy(effects, effect => effect.order);
        for(let effect of sortedEffects) {
            this.add(effect);
        }
    }

    getTargets() {
        const validLocations = ['being played', 'dead pile', 'discard pile', 'draw deck', 'hand', 'play area', 'draw hand'];
        let validTargets = this.game.allCards.filter(card => validLocations.includes(card.location));
        if(this.game.shootout) {
            validTargets = validTargets.concat([this.game.shootout]);
        }
        return validTargets.concat(this.game.getPlayers()).concat([this.game]);
    }

    recalculateDirtyTargets() {
        let dirtyCards = this.game.allCards.filter(card => card.isDirty);

        if(dirtyCards.length === 0) {
            return;
        }

        this.game.queueSimpleStep(() => {
            for(let card of dirtyCards) {
                card.clearDirty();
            }

            for(let effect of this.effects) {
                effect.clearInvalidTargets();
                effect.addTargets(dirtyCards);
                effect.updateAppliedTargets();
            }
        });
    }

    reapplyStateDependentEffects() {
        let stateDependentEffects = this.effects.filter(effect => effect.isStateDependent);
        let needsRecalc = stateDependentEffects.filter(effect => !this.effectsBeingRecalculated.includes(effect));

        if(needsRecalc.length === 0) {
            return;
        }

        this.game.queueSimpleStep(() => {
            this.effectsBeingRecalculated = this.effectsBeingRecalculated.concat(needsRecalc);

            for(let effect of needsRecalc) {
                if(this.effects.includes(effect)) {
                    if(effect.hasEnded()) {
                        effect.cancel();
                        this.effects = this.effects.filter(e => e !== effect);
                    } else {
                        effect.reapply(this.getTargets());
                    }
                }
            }
        });

        this.game.queueSimpleStep(() => {
            this.effectsBeingRecalculated = this.effectsBeingRecalculated.filter(effect => !needsRecalc.includes(effect));
        });
    }

    onCardMoved(event) {
        this.unapplyAndRemove(effect => effect.duration === 'persistent' && effect.source === event.card && (effect.location === event.originalLocation || event.parentChanged && effect.location !== 'any'));
        for(let effect of this.effects) {
            effect.clearInvalidTargets();
            effect.addTargets([event.card]);
            effect.updateAppliedTargets();
        }
    }

    onCardTakenControl(event) {
        let card = event.card;
        for(let effect of this.effects) {
            effect.clearInvalidTargets();
            if(effect.duration === 'persistent' && effect.source === card) {
                // Since the controllers have changed, explicitly cancel the
                // effect for existing targets and then recalculate effects for
                // the new controller from scratch.
                effect.addTargets(this.getTargets());
            } else {
                effect.addTargets([card]);
            }

            effect.updateAppliedTargets();
        }
    }

    onCardBlankToggled(event) {
        let { card, isBlank, blankType } = event;
        let targets = this.getTargets();
        let matchingEffects = this.effects.filter(effect => 
            effect.duration === 'persistent' && 
            effect.source === card &&
            (blankType !== 'trait' || effect.fromTrait));
        for(let effect of matchingEffects) {
            effect.setActive(!isBlank, targets);
        }
    }

    onShootoutPhaseFinished() {
        this.unapplyAndRemove(effect => effect.duration === 'untilEndOfShootoutPhase');
    }

    onShootoutRoundFinished() {
        this.unapplyAndRemove(effect => effect.duration === 'untilEndOfShootoutRound');
    }

    onPhaseEnded(event) {
        this.unapplyAndRemove(effect => effect.duration === 'untilEndOfPhase' && (!effect.phase || event.phase === effect.phase));
    }

    onAtEndOfPhase(event) {
        this.unapplyAndRemove(effect => effect.duration === 'atEndOfPhase' && (!effect.phase || event.phase === effect.phase));
    }

    onRoundEnded() {
        this.unapplyAndRemove(effect => effect.duration === 'untilEndOfRound');
    }

    onPlayWindowClosed(event) {
        if(event.playWindow.name === 'shootout resolution' || event.playWindow.name === 'gambling') {
            this.game.getPlayers().forEach(player => player.resetCheatinResInfo());
        }
    }

    activatePersistentEffects() {
        let targets = this.getTargets();
        let persistentEffects = this.effects.filter(effect => effect.duration === 'persistent');
        for(let effect of persistentEffects) {
            effect.setActive(true, targets);
        }
    }

    registerCustomDurationEvents(effect) {
        if(!effect.until) {
            return;
        }

        let eventNames = Object.keys(effect.until);
        let handler = this.createCustomDurationHandler(effect);
        for(let eventName of eventNames) {
            this.customDurationEvents.push({
                name: eventName,
                handler: handler,
                effect: effect
            });
            this.game.on(eventName, handler);
        }
    }

    unregisterCustomDurationEvents(effect) {
        let [eventsForEffect, remainingEvents] = partition(this.customDurationEvents, event => event.effect === effect);

        for(let event of eventsForEffect) {
            this.game.removeListener(event.name, event.handler);
        }

        this.customDurationEvents = remainingEvents;
    }

    createCustomDurationHandler(customDurationEffect) {
        return (...args) => {
            let event = args[0];
            let listener = customDurationEffect.until[event.name];
            if(listener && listener(...args)) {
                customDurationEffect.cancel();
                this.unregisterCustomDurationEvents(customDurationEffect);
                this.effects = this.effects.filter(effect => effect !== customDurationEffect);
            }
        };
    }

    unapplyAndRemove(match) {
        var [matchingEffects, remainingEffects] = partition(this.effects, match);

        // Explicitly cancel effects in reverse order that they were applied so
        // that problems with STR reduction and burn are avoided.
        for(let effect of matchingEffects.reverse()) {
            effect.cancel();
        }

        this.effects = remainingEffects;
    }

    getAllEffectsOnCard(card, predicate = () => true) {
        return this.effects.filter(effect => effect.hasTarget(card) && predicate(effect));
    }

    getAppliedEffectsOnCard(card, predicate = () => true) {
        return this.effects.filter(effect => effect.isAppliedTo(card) && predicate(effect));
    }
}

module.exports = EffectEngine;
