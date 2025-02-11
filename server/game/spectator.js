class Spectator {
    constructor(id, user) {
        this.user = user;
        this.name = this.user.username;
        this.id = id;

        this.buttons = [];
        this.menuTitle = 'Spectator mode';
    }

    getCardSelectionState() {
        return {};
    }

    isSpectator() {
        return true;
    }

    equals(spectator) {
        return spectator && this.id === spectator.id;
    }
}

module.exports = Spectator;
