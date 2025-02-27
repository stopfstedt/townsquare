const PublicLocations = new Set(['dead pile', 'discard pile', 'out of game', 'play area']);
const CardAction = require('../cardaction');
const PhaseNames = require('../Constants/PhaseNames');
const GameActions = require('../GameActions');
const DiscardCard = require('../GameActions/DiscardCard');
const ChooseYesNoPrompt = require('../gamesteps/ChooseYesNoPrompt');
const StandardActions = require('../PlayActions/StandardActions');

class DropCommand {
    constructor(game, player, card, targetLocation, gamelocation) {
        this.game = game;
        this.player = player;
        this.card = card;
        this.originalLocation = card.location;
        this.targetLocation = targetLocation;
        this.gamelocation = gamelocation;
    }

    execute() {
        if(!this.card.controller.equals(this.player)) {
            return;
        }
        const defaultContext = { game: this.game, player: this.player };

        if(this.originalLocation === this.targetLocation) {
            if(this.card.getType() === 'dude' && this.targetLocation === 'play area' &&
                this.card.gamelocation !== this.gamelocation) {
                const moveActionProps = {
                    title: 'Move',
                    abilitySourceType: 'game',
                    condition: () => this.game.currentPhase === PhaseNames.HighNoon && !this.card.booted,
                    target: {
                        cardCondition: { 
                            location: 'play area',
                            controller: 'any',
                            condition: card => card.uuid === this.gamelocation
                        },
                        cardType: ['location'],
                        autoSelect: true
                    },
                    actionContext: { card: this.card, gameAction: 'moveDude' },
                    handler: context => {
                        this.game.resolveGameAction(GameActions.moveDude({ 
                            card: this.card, 
                            targetUuid: context.target.uuid, 
                            options: { 
                                isCardEffect: false
                            } 
                        }), context);
                    },
                    player: this.player,
                    printed: false
                };
                if(this.gamelocation === this.game.townsquare.uuid) {
                    moveActionProps.target = 'townsquare';
                }
                this.game.resolveStandardAbility(new CardAction(this.game, this.card, moveActionProps), this.player, this.card);
            }
            return;
        }

        if(!this.isValidDropCombination()) {
            return;
        }

        if(this.originalLocation !== 'play area' && this.targetLocation === 'play area') {
            if(this.originalLocation === 'hand' && this.game.currentPhase !== 'setup') {
                this.game.queueStep(new ChooseYesNoPrompt(this.game, this.player, {
                    title: 'Are you perfoming Shoppin\' play?',
                    onYes: () => {
                        this.game.resolveStandardAbility(StandardActions.shoppin(this.card, this.gamelocation), this.player, this.card);
                    },
                    onNo: () => this.game.resolveGameAction(GameActions.putIntoPlay({ 
                        player: this.player,
                        card: this.card, 
                        params: { target: this.gamelocation }
                    }), defaultContext)
                }));
            } else {
                this.game.resolveGameAction(GameActions.putIntoPlay({ 
                    player: this.player,
                    card: this.card, 
                    params: { playingType: 'setup', target: this.gamelocation, force: true }
                }), defaultContext);
            }
        } else if(this.targetLocation === 'dead pile' && this.originalLocation === 'play area') {
            this.player.aceCard(this.card, false, { force: true }, defaultContext);
        } else if(this.targetLocation === 'discard pile' && DiscardCard.allow({ card: this.card, force: true })) {
            this.player.discardCard(this.card, false, { force: true }, defaultContext);
        } else {
            this.player.moveCard(this.card, this.targetLocation);
        }

        if(this.game.currentPhase !== 'setup') {
            if(this.targetLocation === 'being played' && this.originalLocation === 'hand') {
                this.game.addAlert('warning', '{0} is playing {1}', this.player, this.card);
                if(this.game.currentPlayWindow) {
                    this.player.unscriptedCardPlayed = this.card;
                }
            } else {
                this.addGameMessage();
            }
        }
    }

    isValidDropCombination() {
        const DrawDeckCardTypes = ['goods', 'dude', 'action', 'deed', 'spell', 'joker'];
        const AllowedTypesForPile = {
            'being played': DrawDeckCardTypes,
            'dead pile': DrawDeckCardTypes,
            'discard pile': DrawDeckCardTypes,
            'draw deck': DrawDeckCardTypes,
            'hand': DrawDeckCardTypes,
            'draw hand': DrawDeckCardTypes,
            'out of game': DrawDeckCardTypes,
            'play area': ['goods', 'spell', 'dude', 'deed']
        };
        const AllowedTypesForTownSquare = ['goods', 'dude', 'spell'];

        let allowedTypes = AllowedTypesForPile[this.targetLocation];

        if(!allowedTypes) {
            return false;
        }

        if(this.gamelocation === 'townsquare' && !AllowedTypesForTownSquare.includes(this.card.getType())) {
            return false;
        }
        if(['street-left', 'street-right'].includes(this.gamelocation) && (this.card.getType() !== 'deed' || this.card.owner !== this.player)) {
            return false;
        }
        return allowedTypes.includes(this.card.getType());
    }

    addGameMessage() {
        let movedCard = this.isPublicMove() ? this.card : 'a card';
        this.game.addAlert('danger', '{0} has moved {1} from their {2} to their {3}',
            this.player, movedCard, this.originalLocation, this.targetLocation);
    }

    isPublicMove() {
        return this.game.currentPhase !== 'setup' && (PublicLocations.has(this.originalLocation) || PublicLocations.has(this.targetLocation));
    }
}

module.exports = DropCommand;
