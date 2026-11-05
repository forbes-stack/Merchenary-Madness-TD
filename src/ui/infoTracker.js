// infoTracker.js
class InfoTracker {
  static START_GOLD = 125;
  static START_SLOTS = 5;     // towers allowed on the map at the start
  static FIRST_SLOT_FEE = 10; // price of the first extra slot; each one after costs 50% more

  /**
   * @param {number} startHealth Initial health for the user.
   * @param {*} startRound Starting round number.
   */
  constructor(startHealth, startRound) {
    this.maxHealth = startHealth;
    this.startRound = startRound;   // remember the initial starting round (e.g., 1)
    this.health = startHealth;
    this.currency = InfoTracker.START_GOLD;
    this.round = startRound;
    this.isGameOver = false;
    this.towerSlots = InfoTracker.START_SLOTS;
    this.slotsBought = 0;
  }

  /**
   * Reset all tracked values for a new game.
   * Restores health, starting currency, and starting round.
   */
  reset() {
    this.health = this.maxHealth;
    this.currency = InfoTracker.START_GOLD;
    this.round = this.startRound;   // 🔧 was 0 before; this caused weird behavior with WaveManager
    this.isGameOver = false;
    this.towerSlots = InfoTracker.START_SLOTS;
    this.slotsBought = 0;
  }

  // Price of the next extra tower slot: $10, then 50% more each time ($15, $23, $34, ...)
  nextSlotFee() {
    return Math.round(InfoTracker.FIRST_SLOT_FEE * Math.pow(1.5, this.slotsBought));
  }

  // Buy one more tower slot; returns true if it could be afforded
  buySlot() {
    if (!this.decreaseCurrency(this.nextSlotFee())) return false;
    this.towerSlots++;
    this.slotsBought++;
    return true;
  }

  /**
   * Decreases the user health by a set amount.
   * @param {number} amount Amount of health to lose.
   */
  loseHealth(amount) {
    if (this.isGameOver) return;

    this.health -= amount;
    sfx.play('escape');
    if (this.health <= 0) {
      this.health = 0;
      console.log("Game Over");
      this.isGameOver = true;
      sfx.stopMusic();
      sfx.play('gameOver');
    }
  }

  // method to update the round number
  setRound(newRound) {
    this.round = newRound;
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

  // Progresses the game to the next round (called when a wave is started)
  nextRound() {
    this.round += 1;
  }

  // Payout once every enemy of a wave has been killed or has escaped: $20 + $3 per round
  waveCleared(round) {
    if (this.isGameOver) return;
    this.addCurrency(20 + 3 * (round || 1));
    sfx.play('waveCleared');
  }

  // Round shown on the HUD: the current wave, or wave 1 before the first one starts
  displayRound() {
    return Math.max(this.round, 1);
  }

  /**
   * Draws all UI Tracker elements (health bar, currency, round number)
   */
  /**
   * @param {number} towerCount towers on the map, for the "Towers: n/max" line
   */
  draw(towerCount = 0) {
    let panelW = 350;
    let panelH = 250;

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
    textSize(40);
    textAlign(LEFT, CENTER);
    noStroke();
    fill(0, 0, 0, 100);
    text(`Gold: ${this.currency}`, panelX + 97, panelY + 58);
    fill(255, 223, 0);
    textSize(60);
    text(`💰`, panelX + 15, panelY + 52);
    textSize(40);
    text(`Gold: ${this.currency}`, panelX + 95, panelY + 55);
    pop();

    // Health bar
    let barWidth = panelW - 50;
    let barHeight = 50;
    let xPos = panelX + 25;
    let yPos = panelY + 93;
    let currentHealthWidth = map(this.health, 0, this.maxHealth, 0, barWidth);

    const colors = gameSettings.colors(); // red/green, or a color-blind-safe pair

    push();
    fill(...colors.healthEmpty);
    noStroke();
    rect(xPos, yPos, barWidth, barHeight, 5);
    pop();

    push();
    fill(...colors.health);
    noStroke();
    rect(xPos, yPos, currentHealthWidth, barHeight, 5);
    pop();

    push();
    textSize(25);
    textAlign(CENTER, CENTER);
    fill(255, 255, 255, 150);
    text(`${this.health} / ${this.maxHealth}`, xPos + barWidth / 2 + 1, yPos + barHeight / 2 + 1);
    fill(0);
    text(`${this.health} / ${this.maxHealth}`, xPos + barWidth / 2, yPos + barHeight / 2);
    pop();

    // Round
    push();
    textSize(40);
    textAlign(LEFT, CENTER);
    noStroke();
    fill(0, 0, 0, 100);
    text(`Round: ${this.displayRound()}`, panelX + 102, panelY + 188);
    fill(255);
    textSize(60);
    text(`🏁`, panelX + 15, panelY + 188);
    textSize(40);
    text(`Round: ${this.displayRound()}`, panelX + 100, panelY + 186);
    pop();

    // Tower slots used / owned
    push();
    textSize(24);
    textAlign(LEFT, CENTER);
    noStroke();
    fill(0, 0, 0, 100);
    text(`Towers: ${towerCount} / ${this.towerSlots}`, panelX + 102, panelY + 229);
    fill(towerCount >= this.towerSlots ? color(...gameSettings.colors().badText) : color(255));
    text(`Towers: ${towerCount} / ${this.towerSlots}`, panelX + 100, panelY + 227);
    pop();

    textAlign(LEFT, BASELINE);
  }
}
