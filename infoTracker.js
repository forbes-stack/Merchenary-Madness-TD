// infoTracker.js
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
        // --- Settings for Bottom-Right Panel ---
        let panelX = 1125;
        let panelY = 500;
        let panelW = 300; // Panel width

        // 1. Currency Tracker (Replaces "Money")
        push();
        fill(218, 165, 32);
        textSize(30);
        textAlign(LEFT, CENTER);
        noStroke();
        text(`💰 Gold: ${this.currency}`, panelX + 25, panelY + 50);
        pop();


        // 2. Health Bar (Replaces "Health")
        let barWidth = panelW - 50; // Make it fit the panel
        let barHeight = 25;
        let xPos = panelX + 25;
        let yPos = panelY + 80; // Below "Money"

        // Calculate current health width
        let currentHealthWidth = map(this.health, 0, this.maxHealth, 0, barWidth);

        //Health bar background (the empty part)
        push();
        fill(255, 0, 0);
        noStroke();
        rect(xPos, yPos, barWidth, barHeight, 5);
        pop();

        //Health bar foreground (the green part)
        push();
        fill(0, 255, 0);
        noStroke();
        // Draw the current health width
        rect(xPos, yPos, currentHealthWidth, barHeight, 5);
        pop();

        // Health label (on top of the bar)
        push();
        fill(0);
        textSize(18);
        textAlign(CENTER, CENTER);
        text(`${this.health} / ${this.maxHealth}`, xPos + barWidth / 2, yPos + barHeight / 2);
        pop();


        // 3. Round Number Tracker (Replaces "Wave")
        push();
        fill(0);
        textSize(30);
        textAlign(LEFT, CENTER);
        noStroke();
        text(`Round: ${this.round}`, panelX + 25, panelY + 150);
        pop();

        // Reset alignment
        textAlign(LEFT, BASELINE);
    }
}
