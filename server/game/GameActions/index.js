const AbilityAdapter = require('./AbilityAdapter');
const AceCard = require('./AceCard');
const AddBounty = require('./AddBounty');
const AddToHand = require('./AddToHand');
const BootCard = require('./BootCard');
const CallOut = require('./CallOut');
const CancelEffects = require('./CancelEffects');
const ChooseGameAction = require('./ChooseGameAction');
const DecreaseCasualties = require('./DecreaseCasualties');
const DiscardCard = require('./DiscardCard');
const DiscardTopCards = require('./DiscardTopCards');
const DrawCards = require('./DrawCards');
const GainGhostRock = require('./GainGhostRock');
const IncreaseCasualties = require('./IncreaseCasualties');
const JoinPosse = require('./JoinPosse');
const LookAtDeck = require('./LookAtDeck');
const LookAtHand = require('./LookAtHand');
const MoveBounty = require('./MoveBounty');
const MoveDude = require('./MoveDude');
const MoveGhostRock = require('./MoveGhostRock');
const PlaceToken = require('./PlaceToken');
const PutIntoPlay = require('./PutIntoPlay');
const RemoveBounty = require('./RemoveBounty');
const RemoveFromGame = require('./RemoveFromGame');
const RemoveFromPosse = require('./RemoveFromPosse');
const ReturnCardToHand = require('./ReturnCardToHand');
const RevealTopCards = require('./RevealTopCards');
const Search = require('./Search');
const SendHome = require('./SendHome');
const Shuffle = require('./Shuffle');
const ShuffleIntoDeck = require('./ShuffleIntoDeck');
const SimultaneousAction = require('./SimultaneousAction');
const TakeControl = require('./TakeControl');
const UnbootCard = require('./UnbootCard');

const GameActions = {
    /**
     * Adds bounty.
     * 
     * @param {*} props properties: 
     *  - `card`: card to which the bounty will be added
     *  - `amount` (1): amount of bounty to be added
     *  - `maxAmount` (999): maximum amount of bounty for a card for this action
     */
    addBounty: props => new AbilityAdapter(AddBounty, props),
    /**
     * Aces card.
     * 
     * @param {*} props properties:
     *  - `card`: card to be aced
     *  - `allowSave` (true): (to be added)
     *  - `source`: source location of the card to be aced
     */
    aceCard: props => new AbilityAdapter(AceCard, props),
    addToHand: props => new AbilityAdapter(AddToHand, props),
    bootCard: props => new AbilityAdapter(BootCard, props),
    /**
     * Calls out a dude.
     * 
     * @param {*} props properties:
     *  - `caller`: dude who is doing the Call out
     *  - `callee`: dude who is being Called out
     *  - `isCardEffect` (true): **true** if the call out comes from the effect of a card.\
     *  - `canReject` (true): **true** if the callee can reject the call out.\
     */
    callOut: props => new AbilityAdapter(CallOut, props),
    cancelEffects: props => new AbilityAdapter(CancelEffects, props),
    choose: props => new AbilityAdapter(
        new ChooseGameAction(props),
        context => context
    ),
    /**
     * Decreases player casualties.
     * 
     * @param {*} props properties: 
     *  - `player`: player for which casualties should be decreased
     *  - `amount` (999): amount of casualties to be prevented (decreased). 
     *      Default is 999 which basically means all casualties are prevented.
     */    
    decreaseCasualties: props => new AbilityAdapter(DecreaseCasualties, props),
    /**
     * Discards card.
     * 
     * @param {*} props properties:
     *  - `card`: card to be discarded
     *  - `allowSave` (true): (to be added)
     *  - `source`: source location of the card to be discarded
     */
    discardCard: props => new AbilityAdapter(DiscardCard, props),
    discardTopCards: props => new AbilityAdapter(DiscardTopCards, props),
    drawCards: props => new AbilityAdapter(DrawCards, props),
    gainGhostRock: props => new AbilityAdapter(GainGhostRock, props),
    /**
     * Increases player casualties.
     * 
     * @param {*} props properties: 
     *  - `player`: player for which casualties should be increased
     *  - `amount` (1): amount of casualties to be increased
     */      
    increaseCasualties: props => new AbilityAdapter(IncreaseCasualties, props),
    /**
     * Adds dude to posse, and optionally also moves them into the shootout location.
     * 
     * @param {*} props properties:
     *  - `card`: dude to join the posse
     *  - `options`: {\
     *      _isCardEffect_ (true): **true** if the move comes from the effect of a card.\
     *      _moveToPosse_ (true): **true** if the dude should be moved into the shootout location.\
     *      _needToBoot_ (false): **true** if dude has to boot to perform the move, **false** otherwise.\
     *      &nbsp;&nbsp;&nbsp;This option has effect only if moveToPosse is true\
     *      _allowBooted_ (true): **true** if even the booted dude can join, **false** otherwise.\
     *      &nbsp;&nbsp;&nbsp;This option has effect only if moveToPosse is true\
     *  }
     */
    joinPosse: props => new AbilityAdapter(JoinPosse, props),
    lookAtDeck: props => new AbilityAdapter(LookAtDeck, props),
    lookAtHand: props => new AbilityAdapter(LookAtHand, props),
    moveBounty: props => new AbilityAdapter(MoveBounty, props),
    /**
     * Moves dude from one game location in play area to other.
     * 
     * @param {*} props properties:
     *  - `card`: dude to be moved
     *  - `targetUuid`: UUID of the location card (can be deed, townsquare or outfit)
     *  - `options`: {\
     *      _isCardEffect_ (true): **true** if the move comes from the effect of a card\
     *      _needToBoot_ (false): **true** if dude has to boot to perform the move\
     *      &nbsp;&nbsp;&nbsp;**false** if dude does not boot to perform the move\
     *      &nbsp;&nbsp;&nbsp;**null** if the booting will be decided based on the game rules\
     *      _allowBooted_ (true): **true** if even the booted dude can be moved\
     *  }
     */
    moveDude: props => new AbilityAdapter(MoveDude, props),
    moveGhostRock: props => new AbilityAdapter(MoveGhostRock, props),
    placeToken: props => new AbilityAdapter(PlaceToken, props),
    putIntoPlay: props => new AbilityAdapter(PutIntoPlay, props),
    /**
     * Removes bounty.
     * 
     * @param {*} props properties:
     *  - `card`: card from which the bounty will be removed
     *  - `options`: {\
     *      _removeAll_ (false): **true** if all bounty should be removed, **false** otherwise\
     *      _amount_ (1): amount of the bounty to be removed\
     *  }
     */
    removeBounty: props => new AbilityAdapter(RemoveBounty, props),
    removeFromGame: props => new AbilityAdapter(RemoveFromGame, props),
    removeFromPosse: props => new AbilityAdapter(RemoveFromPosse, props),
    returnCardToHand: props => new AbilityAdapter(ReturnCardToHand, props),
    revealTopCards: props => new AbilityAdapter(RevealTopCards, props),
    /**
     * Searches specific location for a card(s).
     * 
     * @param {*} props properties:
     *  - title
     *  - gameAction, 
     *  - location, 
     *  - match, 
     *  - message, 
     *  - cancelMessage, 
     *  - topCards, 
     *  - numToSelect, 
     *  - player, 
     *  - searchedPlayer
     *  - handler
     */
    search: props => new AbilityAdapter(
        new Search(props),
        context => ({ context })
    ),
    /**
     * Sends dude home by moving him to outfit location.
     * 
     * @param {*} props properties:
     *  - `card`: dude to be sent home
     *  - `options`: {\
     *      _isCardEffect_ (true): **true** if the action comes from the effect of a card\
     *      _needToBoot_ (true): **true** if dude will be sent home booted, **false** otherwise\
     *      _allowBooted_ (true): **true** if even the booted dude can be sent home, **false** otherwise\
     *  }
     */
    sendHome: props => new AbilityAdapter(SendHome, props),
    shuffle: props => new AbilityAdapter(Shuffle, props),
    shuffleIntoDeck: props => new AbilityAdapter(ShuffleIntoDeck, props),
    simultaneously: function(actions) {
        return new SimultaneousAction(actions);
    },
    takeControl: props => new AbilityAdapter(TakeControl, props),
    unbootCard: props => new AbilityAdapter(UnbootCard, props)
};

module.exports = GameActions;
