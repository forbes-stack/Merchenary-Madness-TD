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

    /**
     * Draws all UI Tracker elements (health bar, currency, round number)
     */
    draw() {
        // 1. Health Bar
        let barWidth = 200;
        let barHeight = 25;
        let xPos = 20;
        let yPos= 20;

        //Health bar background
        push();
        fill(255, 0, 0);
        noStroke();
        rect(xPos, yPos, currentHealthWidth, barHeight, 5);
        pop();

        // Health label
        push();
        fill(0);
        textSize(18);
        textAlign(CENTER, CENTER);
        text('Health: ${this.health} / ${this.maxHealth}`, xPos + barWidth / 2, yPos + barHeight / 2');
        pop();

        // 2. Currency Tracker
        let currencyX = 20;
        let currencyY = height - 30;

        push();
        fill(255, 215, 0);
        textSize(25);
        textAlign(LEFT, CENTER);
        noStroke();
        text('💰 Gold: ${this.currency}`, currencyX, currencyY');
        pop();

        // 3. Round Number Tracker
        let roundX = width - 20;
        let roundY = 30;

        push();
        fill(255);
        textSize(25);
        textAlign(RIGHT, CENTER);
        noStroke();
        text('Round: ${this.round}`, roundX, roundY');
        pop();

        textAlign(LEFT, BASELINE);
    }
}
