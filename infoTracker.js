class InfoTracker {
    /**
     *
     * @param {number} startHealth Initial health for the user.
     * @param {*} startRound Starting round number.
     */
    constructor(startHealth, startRound) {
        this.maxHealth = startHealth;
        this.health = startHealth;
        this.currency = 50;
        this.round = startRound;
    }

    /**
     * Decreases the user health by a set amount.
     * @param {number} amount Amount of health to lose.
     */
    loseHealth(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            console.log("Game Over"); // game ends when user health hits 0.
            noLoop();
        }
    }

    /**
     * Increases player currency.
     * @param {number} amount Amount of currency to gain.
     */
    addCurrency(amount) {
        this.currency += amount;
    }

    /**
     * Advances the game to the next round.
     */
    nextRound() {
        this.round++;
        this.addCurrency(50 + this.round * 5); // adds currency for completing round.
    }
}
