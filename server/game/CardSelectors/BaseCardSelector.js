const CardMatcher = require('../CardMatcher');

const AllowedSpecialTargets = [
    'location',
    'townsquare',
    'currentHome'
];
const TownsquareTargets = ['townsquare', 'location'];

/**
 * Base class that represents card selection requirements and the behaviours of
 * their associated prompts.
 */
class BaseCardSelector {
    /**
     * @param {Object} properties
     * @param {Function} properties.cardCondition
     * function that takes a potential card and the ability context and returns
     * whether that card is selectable.
     * @param {(string|string[])} properties.cardType
     * either a string or array of strings indicating the type of cards allowed
     * to be selected.
     * @param {string} properties.gameAction
     * the game action checked for immunity purposes on potential target cards.
     * @param {boolean} properties.singleController
     * indicates that all cards selected must belong to the same controller.
     * @param {boolean} properties.isCardEffect
     * indicates whether the selector is part of a card effect and thus should
     * check for card immunity
     */
    constructor(properties) {
        this.cardType = properties.cardType;
        this.gameAction = properties.gameAction;
        this.singleController = properties.singleController;
        this.isCardEffect = properties.isCardEffect;
        this.optional = !!properties.optional;

        if(!Array.isArray(properties.cardType)) {
            this.cardType = [properties.cardType];
        }

        if(this.isSpecialTarget()) {
            this.cardCondition = CardMatcher.createMatcher({ 
                location: 'play area', 
                controller: properties.cardCondition.controller || 'any',
                condition: this.buildSpecialTargetCondition(properties)
            });
        } else {
            this.cardCondition = CardMatcher.createMatcher(properties.cardCondition);
        }

        if(this.cardType.includes('location')) {
            this.cardType = this.cardType.concat(['townsquare', 'deed', 'outfit']);
        }
    }

    /**
     * Returns whether the specified card can be targeted.
     * @param {BaseCard} card
     * @param {AbilityContext} context
     * @param {Array} selectedCards
     * @returns {boolean}
     */
    canTarget(card, context, selectedCards) {
        if(context) {
            context.selectedCards = selectedCards || [];
        }

        return (
            this.cardType.includes(card.getType()) &&
            this.cardCondition(card, context) &&
            this.isAllowedForGameAction(card, context)
        );
    }

    buildSpecialTargetCondition(properties) {
        if(typeof(properties.cardCondition) === 'function') {
            return properties.cardCondition;
        }
        return properties.cardCondition.condition || (() => true);
    }

    isSpecialTarget() {
        return this.cardType.length === 1 && BaseCardSelector.isAllowedSpecialTarget(this.cardType[0]);
    }

    isAllowedForGameAction(card, context) {
        if(!this.isCardEffect) {
            return true;
        }
        if(!card.allowGameAction('target', context)) {
            return false;
        }
        if(typeof(this.gameAction) === 'function') {
            return card.allowGameAction(this.gameAction(card, context), context);
        }
        if(!Array.isArray(this.gameAction)) {
            return card.allowGameAction(this.gameAction, context);
        }
        return this.gameAction.every(gameAction => card.allowGameAction(gameAction, context));
    }

    /**
     * Returns a list of cards that can be targeted by this selector.
     * @param {AbilityContext} context
     * @returns {BaseCard[]}
     */
    getEligibleTargets(context) {
        return context.game.allCards.filter(card => this.canTarget(card, context));
    }

    /**
     * Returns whether enough cards have been selected to fulfill the conditions
     * of the prompt.
     * @param {BaseCard[]} selectedCards
     * the currently selected cards
     * @param {integer} numPlayers
     * the number of players in the game
     * @returns {boolean}
     */
    hasEnoughSelected(selectedCards) {
        return this.optional || selectedCards.length > 0;
    }

    /**
     * Returns whether there are enough valid cards to fulfill the condition of
     * the prompt.
     * @param {AbilityContext} context
     * @returns {boolean}
     */
    hasEnoughTargets(context) {
        if(this.cardType.some(cardType => TownsquareTargets.includes(cardType)) && 
            this.canTarget(context.game.townsquare.locationCard, context)) {
            return true;
        }
        return this.optional || this.isSpecialTarget() ||
            context.game.allCards.some(card => this.canTarget(card, context));
    }

    /**
     * Returns the default title used for this selector when prompting players.
     * @returns {string}
     */
    defaultActivePromptTitle() {
        return 'Select card(s)';
    }

    /**
     * Returns whether a prompt using this selector should automatically complete
     * once enough cards have been selected.
     * @returns {boolean}
     */
    automaticFireOnSelect() {
        return false;
    }

    /**
     * Returns whether adding the specified card to the current selection would
     * take the selector beyond the limits it imposes (be they the number of cards,
     * a max aggregated stat, or other criteria).
     * @param {BaseCard[]} selectedCards
     * an array of the currently selected cards
     * @param {BaseCard} card
     * the new card being considered for selection
     * @returns {boolean}
     */
    wouldExceedLimit() {
        return false;
    }

    /**
     * Returns whether the selector has reached its limit (number of cards, max
     * aggregate stat, etc) given the currently selected cards.
     * @param {BaseCard[]} selectedCards
     * @param {integer} numPlayers
     * @returns {boolean}
     */
    hasReachedLimit() {
        return false;
    }

    /**
     * Takes an array of cards and returns them in the proper format to send to
     * onSelect handlers for the prompt. By default, it just returns the array.
     * @param {BaseCard[]} cards
     * @returns {*}
     */
    formatSelectParam(cards) {
        return cards;
    }

    /**
     * Returns whether the specified card can be targeted if the singleController
     * flag is set.
     * @param {BaseCard[]} selectedcards
     * @param {BaseCard} card
     * @returns {boolean}
     */
    checkForSingleController(selectedCards, card) {
        if(!this.singleController || (selectedCards || []).length === 0) {
            return true;
        }

        return card.controller.equals(selectedCards[0].controller);
    }

    static isAllowedSpecialTarget(target) {
        return AllowedSpecialTargets.includes(target);
    }
}

module.exports = BaseCardSelector;
