// infoTracker.js
// infoTracker.js
class InfoTracker {
  /**
   * @param {number} startHealth Initial health for the user.
   * @param {*} startRound Starting round number.
   */
  constructor(startHealth, startRound) {
    this.maxHealth = startHealth;
    this.health = startHealth;
    this.currency = 75;
    this.round = startRound;
    this.isGameOver = false;
  }

  /**
   * Decreases the user health by a set amount.
   * @param {number} amount Amount of health to lose.
   */
  loseHealth(amount) {
    if (this.isGameOver) return;

    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      console.log("Game Over");
      this.isGameOver = true;
    }
  }

  // attempt to spend currency; returns true if success
  decreaseCurrency(amount) {
    if (typeof amount !== "number" || amount <= 0) return false;
    if (this.currency < amount) return false;
    this.currency -= amount;
    return true;
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
  // ORIGINAL:
  // nextRound() {
  //   this.round++;
  //   this.addCurrency(50 + this.round * 5); // adds currency for completing round.
  // }

  // CHANGED: linear growth — end of round N pays 10 * N, then increment round
  nextRound() {
    this.addCurrency(10 * this.round); // payout for the round that just ended
    this.round += 1;                   // move to the next round
  }

  /**
   * Draws all UI Tracker elements (health bar, currency, round number)
   */
  draw() {
    let panelW = 300;
    let panelH = 200;

    // anchor to bottom-right
    let panelX = width - panelW;
    let panelY = height - panelH;

    if (typeof uiBg !== 'undefined') {
      image(uiBg, panelX, panelY, panelW, panelH);
    } else {
      push();
      fill(139, 69, 19, 200);
      stroke(85, 53, 12);
      strokeWeight(4);
      rect(panelX, panelY, panelW, panelH, 10);
      pop();
    }

    // Gold
    push();
    fill(218, 165, 32);
    textSize(30);
    textAlign(LEFT, CENTER);
    noStroke();
    fill(0, 0, 0, 100);
    text(`💰 Gold: ${this.currency}`, panelX + 27, panelY + 52);
    fill(255, 223, 0);
    text(`💰 Gold: ${this.currency}`, panelX + 25, panelY + 50);
    pop();

    // Health bar
    let barWidth = panelW - 50;
    let barHeight = 25;
    let xPos = panelX + 25;
    let yPos = panelY + 85;
    let currentHealthWidth = map(this.health, 0, this.maxHealth, 0, barWidth);

    push();
    fill(255, 0, 0);
    noStroke();
    rect(xPos, yPos, barWidth, barHeight, 5);
    pop();

    push();
    fill(0, 255, 0);
    noStroke();
    rect(xPos, yPos, currentHealthWidth, barHeight, 5);
    pop();

    push();
    fill(0);
    textSize(18);
    textAlign(CENTER, CENTER);
    fill(255, 255, 255, 150);
    text(`${this.health} / ${this.maxHealth}`, xPos + barWidth / 2 + 1, yPos + barHeight / 2 + 1);
    fill(0);
    text(`${this.health} / ${this.maxHealth}`, xPos + barWidth / 2, yPos + barHeight / 2);
    pop();

    // Round
    push();
    fill(255);
    textSize(30);
    textAlign(LEFT, CENTER);
    noStroke();
    fill(0, 0, 0, 100);
    text(`Round: ${this.round}`, panelX + 27, panelY + 152);
    fill(255);
    text(`Round: ${this.round}`, panelX + 25, panelY + 150);
    pop();

    textAlign(LEFT, BASELINE);
  }
}
