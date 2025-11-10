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
        this.isGameOver = false;
    }

    /**
     * Decreases the user health by a set amount.
     * @param {number} amount Amount of health to lose.
     */
    loseHealth(amount) {
        // Don't lose health if game is already over
        if (this.isGameOver) return;

        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            console.log("Game Over"); // game ends when user health hits 0.

            // --- MODIFICATION ---
            // Instead of stopping the draw loop, we set a flag
            // noLoop(); // <-- REMOVED THIS
            this.isGameOver = true; // <-- ADDED THIS
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
        let panelW = 300;
        let panelH = 200;

        // Use width/height to anchor to bottom-right
        let panelX = width - panelW; // 20px padding from edge
        let panelY = height - panelH; // 20px padding from edge

        // --- Draw Panel Background (using uiBg if available) ---
        // This assumes uiBg is loaded and you want to use it
        if (typeof uiBg !== 'undefined') {
            image(uiBg, panelX, panelY, panelW, panelH);
        } else {
            // Fallback if image isn't loaded
            push();
            fill(139, 69, 19, 200); // Brownish fallback
            stroke(85, 53, 12);
            strokeWeight(4);
            rect(panelX, panelY, panelW, panelH, 10);
            pop();
        }


        // 1. Currency Tracker (Replaces "Money")
        push();
        fill(218, 165, 32); // Gold color
        textSize(30);
        textAlign(LEFT, CENTER);
        noStroke();
        // Shadow for readability
        fill(0, 0, 0, 100);
        text(`💰 Gold: ${this.currency}`, panelX + 27, panelY + 52);
        // Main text
        fill(255, 223, 0); // Brighter gold
        text(`💰 Gold: ${this.currency}`, panelX + 25, panelY + 50);
        pop();

        // 2. Health Bar (Replaces "Health")
        let barWidth = panelW - 50; // Make it fit the panel
        let barHeight = 25;
        let xPos = panelX + 25;
        let yPos = panelY + 85; // Below "Money"

        // Calculate current health width
        let currentHealthWidth = map(this.health, 0, this.maxHealth, 0, barWidth);

        //Health bar background (the empty part)
        push();
        fill(255, 0, 0); // Bright red
        noStroke();
        rect(xPos, yPos, barWidth, barHeight, 5);
        pop();

        //Health bar foreground (the green part)
        push();
        fill(0, 255, 0); // Bright green
        noStroke();
        // Draw the current health width
        rect(xPos, yPos, currentHealthWidth, barHeight, 5);
        pop();

        // Health label (on top of the bar)
        push();
        fill(0);
        textSize(18);
        textAlign(CENTER, CENTER);
        // Shadow
        fill(255, 255, 255, 150);
        text(`${this.health} / ${this.maxHealth}`, xPos + barWidth / 2 + 1, yPos + barHeight / 2 + 1);
        // Main text
        fill(0);
        text(`${this.health} / ${this.maxHealth}`, xPos + barWidth / 2, yPos + barHeight / 2);
        pop();

        // 3. Round Number Tracker (Replaces "Wave")
        push();
        fill(255); // White
        textSize(30);
        textAlign(LEFT, CENTER);
        noStroke();
        // Shadow
        fill(0, 0, 0, 100);
        text(`Round: ${this.round}`, panelX + 27, panelY + 152);
        // Main text
        fill(255);
        text(`Round: ${this.round}`, panelX + 25, panelY + 150);
        pop();

        // Reset alignment
        textAlign(LEFT, BASELINE);
    }
}
