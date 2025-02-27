const BaseAbility = require('../baseability');
const Costs = require('../costs');
const GameActions = require('../GameActions');
const SingleCostReducer = require('../singlecostreducer');

class PutIntoPlayCardAction extends BaseAbility {
    constructor(properties = { playType: 'ability', abilitySourceType: 'card', targetLocationUuid: '' }, callback) {
        super({
            abilitySourceType: properties.abilitySourceType,
            cost: [
                Costs.payReduceableGRCost(properties.playType)
            ],
            target: properties.targetProperties
        });
        this.properties = properties;
        this.playType = properties.playType;
        this.reduceAmount = properties.reduceAmount;
        this.callback = callback;
    }

    isAction() {
        return false;
    }

    meetsRequirements(context) {
        if(!super.meetsRequirements(context)) {
            return false;
        }
        var { player, source } = context;

        return (
            source.getType() !== 'action' &&
            player.isCardInPlayableLocation(source, this.playType) &&
            player.canPutIntoPlay(source, { playingType: this.playType, context })
        );
    }

    resolveCosts(context) {
        var { game, player, source } = context;
        if(this.reduceAmount) {
            this.costReducer = new SingleCostReducer(game, player, null, { 
                card: source, 
                amount: this.reduceAmount, 
                minimum: this.properties.minimum,
                playingTypes: 'any'
            });
            player.addCostReducer(this.costReducer);
        }
        return super.resolveCosts(context);
    }

    executeHandler(context) {
        var { game, player, source } = context;
        game.resolveGameAction(GameActions.putIntoPlay({                        
            player: player,
            card: source, 
            params: Object.assign(this.properties, { context: context })
        })).thenExecute(event => {
            if(this.costReducer) { 
                event.player.removeCostReducer(this.costReducer);     
            }
        }).thenExecute(event => {
            if(this.callback) {
                this.callback(event);
            }
        });
    }

    playTypePlayed() {
        return this.playType;
    }
}

module.exports = PutIntoPlayCardAction;
