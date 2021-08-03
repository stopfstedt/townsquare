const DudeCard = require('../../dudecard.js');
const GameActions = require('../../GameActions/index.js');

class CarterRichardson extends DudeCard {
    constructor(owner, cardData) {
        super(owner, cardData, true);
    }
    setupCardAbilities(ability) {
        this.playAction({
            title: 'Carter Richardson: shootout',
            playType: 'shootout',
            cost: ability.costs.payReduceableGRCost(),
            condition: () => this.game.shootout && this.game.shootout.getPosseByPlayer(this.controller.getOpponent()).getDudes(dude => dude.isWanted()).length,
            message: context => this.game.addMessage('{0} plays {1} into your posse', context.player, this),
            handler: context => {
                this.game.resolveGameAction(GameActions.putIntoPlay({ 
                    card: this, 
                    player: context.player, 
                    params: { 
                        playingType: 'ability',
                        context: context
                    }
                }), context).thenExecute(() => this.game.resolveGameAction(GameActions.joinPosse({ card: this }), context));
            }
        });
        this.action({
            title: 'Carter Richardson: noon',
            playType: ['noon'],
            target: {
                activePromptTitle: 'Select a dude',
                cardCondition: { 
                    location: 'play area', 
                    controller: 'opponent', 
                    condition: dude => this.isOpponentsDudeWithHighestBounty(dude)
                },
                cardType: ['dude']
            },
            actionContext: { card: this, gameAction: 'moveDude' },
            message: context => 
                this.game.addMessage('{0} uses {1} to move him to {2}\'s location', context.player, this, context.target),
            handler: context => {
                this.game.resolveGameAction(GameActions.moveDude({ 
                    card: this, 
                    targetUuid: context.target.gamelocation
                }), context);
            }
        });
    }

    isOpponentsDudeWithHighestBounty(dude) {
        const wantedOpponentDudes = this.game.getDudesInPlay().filter(dude => dude.isWanted());
        const highestBounty = wantedOpponentDudes.reduce((highestBounty, dude) => {
            return Math.max(dude.bounty, highestBounty);
        }, 0);
        return wantedOpponentDudes.filter(dude => dude.bounty === highestBounty).includes(dude);
    }
}

CarterRichardson.code = '21036';

module.exports = CarterRichardson;
