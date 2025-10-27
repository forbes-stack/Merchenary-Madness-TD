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
}

//still WIP.
