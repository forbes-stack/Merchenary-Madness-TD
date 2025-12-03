// UI.js
class UI {
  constructor(path, assets = {}) {
    this.path = path;

    // Map area where towers are allowed
    this.dropZone = { x: 0, y: 0, w: 1400, h: 500 };

    // Tower templates in the palette
    this.towerTypes = [
      { type: "basic",   range: 120, damage: 10, rate: 0.5, cost: 25 },
      { type: "gatling", range: 100, damage: 3,  rate: 0.1, cost: 75 },
      { type: "cannon",  range: 150, damage: 30, rate: 1, cost: 100 },
      { type: "sniper",  range: 20,  damage: 75, rate: 1.5, cost: 125 },
      // add more types with their own cost...
    ];

    // Palette tile centers
    this.paletteSlots = [
      { x: 75,  y: 550, type: "basic" },
      { x: 225, y: 550, type: "gatling" },
      { x: 375, y: 550, type: "cannon" },
      { x: 525, y: 550, type: "sniper" }
    ];

    this.placedTowers = [];

    // Drag helper (expects TowerDragger to be loaded)
    this.dragger = new TowerDragger(this.towerTypes, this.dropZone);

    this.bg = assets.bg;
    this.uiBg = assets.uiBg;
    this.gattlingIcon = assets.gattlingIcon;
    this.cowboyIcon = assets.cowboyIcon;
    this.cannonIcon = assets.cannonIcon;
    this.sniperIcon = assets.sniperIcon;

    // Upgrade Management
    this.upgradeManager = new UpgradeManager();
    this.selectedTower = null;

    // Store button hitboxes here for mousePressed
    this.upgradeButtons = [];

    // Restart button hitbox (used in Game Over state)
    this.restartButton = null;

    // Pause menu buttons (resume/restart)
    this.pauseButtons = [];
  }

  /**
   * Base purchase cost of a tower instance (no upgrades).
   * Uses the palette definitions and tower.towerType.
   */
  getTowerBaseCost(tower) {
    if (!tower) return 0;

    // Prefer explicit base cost if you ever set it on tower
    if (typeof tower.baseCost === "number") {
      return tower.baseCost;
    }

    const typeKey = tower.towerType || tower.type; // support both just in case
    if (!typeKey) return 0;

    const def = this.towerTypes.find(tt => tt.type === typeKey);
    if (def && typeof def.cost === "number") {
      return def.cost;
    }

    return 0;
  }

  /**
   * Total gold invested in this tower:
   * base cost + all upgrade costs on its chosen path.
   */
  getTowerTotalInvestedCost(tower) {
    if (!tower) return 0;

    const baseCost = this.getTowerBaseCost(tower);
    const typeKey = tower.towerType || tower.type;
    const path = tower.upgradePath;  // 'damage' or 'rate' or null
    const level = tower.level || 0;  // 0..3

    if (!this.upgradeManager || !this.upgradeManager.upgrades[typeKey]) {
      return baseCost;
    }

    // If no path chosen yet, no upgrades were applied
    if (path !== "damage" && path !== "rate") {
      return baseCost;
    }

    const pathUpgrades = this.upgradeManager.upgrades[typeKey][path];
    if (!pathUpgrades) return baseCost;

    let extra = 0;
    const appliedLevels = Math.min(level, pathUpgrades.length);
    for (let i = 0; i < appliedLevels; i++) {
      extra += pathUpgrades[i].cost;
    }

    return baseCost + extra;
  }

  /**
   * Sell the currently selected tower for half its total invested value.
   */
  sellSelectedTower(info) {
    if (!this.selectedTower || !info) return;

    const totalCost = this.getTowerTotalInvestedCost(this.selectedTower);
    const refund = Math.floor(totalCost / 2);

    if (refund > 0 && typeof info.addCurrency === "function") {
      info.addCurrency(refund);
    }

    // Remove tower from placedTowers
    const idx = this.placedTowers.indexOf(this.selectedTower);
    if (idx !== -1) {
      this.placedTowers.splice(idx, 1);
    }

    // Clear selection so the menu closes
    this.selectedTower = null;
  }

  drawUpgradeUI(info) {
    if (!this.selectedTower) return;

    const t = this.selectedTower;
    const options = this.upgradeManager.getUpgradeOptions(t);

    // CRITICAL: Clear hitboxes before drawing new ones.
    this.upgradeButtons = [];

    // Position buttons underneath the tower
    let startY = t.y + 30;
    let btnW = 120;
    let btnH = 35;

    // Helper to draw a button
    const drawBtn = (offsetY, label, cost, type) => {
      const btnX = t.x - (btnW / 2);
      const btnY = startY + offsetY;

      const affordable = info.currency >= cost;

      push();
      fill(affordable ? 'green' : 'red');
      stroke(255);
      rect(btnX, btnY, btnW, btnH, 5);

      fill(255);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(14);
      text(`${label} ($${cost})`, btnX + btnW / 2, btnY + btnH / 2);
      pop();

      // Add to hitboxes
      this.upgradeButtons.push({
        x: btnX, y: btnY, w: btnW, h: btnH,
        type: type // 'damage' or 'rate' or 'sell'
      });
    };

    // Helper to draw locked path message
    const drawLocked = (offsetY) => {
      push();
      fill(100);
      stroke(255);
      rect(t.x - (btnW / 2), startY + offsetY, btnW, btnH, 5);
      fill(200);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(12);
      text("Path Locked", t.x, startY + offsetY + btnH / 2);
      pop();
    };

    // --- Upgrades layout ---
    let nextOffsetY = 0;

    // Damage option
    if (options.damage) {
      drawBtn(0, "Upgr Dmg", options.damage.cost, 'damage');
      nextOffsetY = 40;
    } else if (t.upgradePath === 'rate' && !t.isMaxLevel()) {
      drawLocked(0);
      nextOffsetY = 40;
    }

    // Rate option
    if (options.rate) {
      drawBtn(nextOffsetY, "Upgr Rate", options.rate.cost, 'rate');
      nextOffsetY += 40;
    } else if (t.upgradePath === 'damage' && !t.isMaxLevel()) {
      drawLocked(nextOffsetY);
      nextOffsetY += 40;
    }

    // Max level message
    if (t.isMaxLevel && t.isMaxLevel()) {
      push();
      fill(255, 215, 0);
      textAlign(CENTER);
      text("MAX LEVEL", t.x, startY + nextOffsetY + 15);
      pop();
      nextOffsetY += 35;
    }

    // --- Sell Button (always available when tower is selected) ---
    const totalCost = this.getTowerTotalInvestedCost(t);
    const sellPrice = Math.floor(totalCost / 2);

    const sellOffsetY = nextOffsetY + 10; // a bit below other buttons
    const sellX = t.x - (btnW / 2);
    const sellY = startY + sellOffsetY;

    push();
    rectMode(CORNER);
    fill(150, 75, 0);  // brown-ish sell button
    stroke(255);
    rect(sellX, sellY, btnW, btnH, 5);

    fill(255);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(14);
    text(`Sell ($${sellPrice})`, sellX + btnW / 2, sellY + btnH / 2);
    pop();

    // Add sell button hitbox
    this.upgradeButtons.push({
      x: sellX, y: sellY, w: btnW, h: btnH,
      type: 'sell'
    });
  }

  display(info, allEnemies) {
    // CRITICAL: Clear old button hitboxes every single frame.
    this.upgradeButtons = [];

    const boxes = [
      [50, 525], [50, 625],
      [200, 525], [200, 625],
      [350, 525], [350, 625],
      [500, 525], [500, 625],
      [650, 525], [650, 625],
      [800, 525], [800, 625],
      [950, 525], [950, 625]
    ];
    for (let [x, y] of boxes) {
      rect(x, y, 50, 50);
    }

    // Palette icons
    for (let slot of this.paletteSlots) {
      if (!slot) continue; // Safety Check
      const base = this.towerTypes.find(t => t.type === slot.type);
      if (!base) continue;

      push();
      noStroke();
      if (slot.type === "basic") {
        fill(100, 100, 255);
        imageMode(CENTER);
        if (this.cowboyIcon) image(this.cowboyIcon, slot.x, slot.y, 50, 50);
        else circle(slot.x, slot.y, 30);
      } else if (slot.type === "gatling") {
        fill(0, 150, 0);
        imageMode(CENTER);
        if (this.gattlingIcon) image(this.gattlingIcon, slot.x, slot.y, 50, 50);
        else circle(slot.x, slot.y, 30);
      } else if (slot.type === "cannon") {
        imageMode(CENTER);
        if (this.cannonIcon) image(this.cannonIcon, slot.x, slot.y, 50, 50);
        else {
          const r = 15;
          triangle(
            slot.x, slot.y - r * 0.8,
            slot.x - r, slot.y + r * 0.6,
            slot.x + r, slot.y + r * 0.6
          );
        }
      } else if (slot.type === "sniper") {
        imageMode(CENTER);
        if (this.sniperIcon) image(this.sniperIcon, slot.x, slot.y, 45, 45);
        else {
          const r = 15;
          triangle(
            slot.x, slot.y - r * 0.8,
            slot.x - r, slot.y + r * 0.6,
            slot.x + r, slot.y + r * 0.6
          );
        }
      }
      pop();

      const cost = base.cost;
      let hasEnoughGold = false;
      if (info && typeof info.currency === 'number') {
        hasEnoughGold = info.currency >= cost;
      }

      push();
      textAlign(CENTER, TOP);
      textSize(16);
      noStroke();

      if (hasEnoughGold) fill(255, 223, 0);
      else fill(255, 0, 0);

      text(`$${cost}`, slot.x, slot.y + 25);
      pop();
    }

    // Placed towers: update once with the whole enemy array, then draw
    for (let t of this.placedTowers) {
      if (!t) continue; // Safety Check
      if (allEnemies && info) {
        t.update(allEnemies, info);
      }
      t.draw();
    }

    // Draw selection and upgrade UI
    if (this.selectedTower) {
      if (!this.placedTowers.includes(this.selectedTower)) {
        this.selectedTower = null;
      } else {
        this.selectedTower.drawSelection();
        this.drawUpgradeUI(info);
      }
    }

    // Dragging preview (ghost tower + range)
    this.dragger.drawPreview(info, this.path, this.placedTowers);
  }

  /**
   * Game Over overlay with Restart button.
   */
  displayGameOver() {
    // Dim the entire screen
    push();
    fill(0, 0, 0, 180);
    noStroke();
    rect(0, 0, width, height);
    pop();

    // "GAME OVER" text
    push();
    textAlign(CENTER, CENTER);
    textSize(80);
    stroke(0);
    strokeWeight(4);
    fill(255, 0, 0);
    text("GAME OVER", width / 2, height / 2 - 80);
    pop();

    // Restart button under the text
    const btnW = 220;
    const btnH = 60;
    const btnX = width / 2 - btnW / 2;
    const btnY = height / 2 + 10;

    // Save hitbox for mousePressed
    this.restartButton = { x: btnX, y: btnY, w: btnW, h: btnH };

    push();
    rectMode(CORNER);
    fill(50, 200, 50);
    stroke(0);
    strokeWeight(3);
    rect(btnX, btnY, btnW, btnH, 12);

    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(28);
    text("Restart", btnX + btnW / 2, btnY + btnH / 2);
    pop();
  }

  /**
   * Pause menu overlay with Resume + Restart buttons.
   */
  displayPauseMenu() {
    // Clear previous pause button hitboxes
    this.pauseButtons = [];

    // Dim the entire screen (a bit lighter than game over if you want)
    push();
    fill(0, 0, 0, 140);
    noStroke();
    rect(0, 0, width, height);
    pop();

    // "PAUSED" text
    push();
    textAlign(CENTER, CENTER);
    textSize(70);
    stroke(0);
    strokeWeight(4);
    fill(255);
    text("PAUSED", width / 2, height / 2 - 100);
    pop();

    const btnW = 220;
    const btnH = 60;
    const centerX = width / 2 - btnW / 2;
    const resumeY = height / 2 - 10;
    const restartY = resumeY + 80;

    // Resume button
    push();
    rectMode(CORNER);
    fill(70, 130, 180); // bluish
    stroke(0);
    strokeWeight(3);
    rect(centerX, resumeY, btnW, btnH, 12);

    fill(255);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(24);
    text("Resume", centerX + btnW / 2, resumeY + btnH / 2);
    pop();

    this.pauseButtons.push({
      x: centerX,
      y: resumeY,
      w: btnW,
      h: btnH,
      type: "resume"
    });

    // Restart button (reuse same label style as game over)
    push();
    rectMode(CORNER);
    fill(50, 200, 50);
    stroke(0);
    strokeWeight(3);
    rect(centerX, restartY, btnW, btnH, 12);

    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(24);
    text("Restart", centerX + btnW / 2, restartY + btnH / 2);
    pop();

    this.pauseButtons.push({
      x: centerX,
      y: restartY,
      w: btnW,
      h: btnH,
      type: "restart"
    });
  }

  /**
   * Handle clicks when the game is over.
   * `onRestart` is a callback (like restartGame in sketch.js).
   */
  handleGameOverClick(onRestart) {
    if (!this.restartButton) return;

    const b = this.restartButton;
    if (
      mouseX > b.x && mouseX < b.x + b.w &&
      mouseY > b.y && mouseY < b.y + b.h
    ) {
      if (typeof onRestart === "function") {
        onRestart();
      }
    }
  }

  /**
   * Handle clicks when the game is paused.
   * `onResume` and `onRestart` come from sketch.js
   */
  handlePauseClick(onResume, onRestart) {
    if (!this.pauseButtons || this.pauseButtons.length === 0) return;

    for (let b of this.pauseButtons) {
      if (
        mouseX > b.x && mouseX < b.x + b.w &&
        mouseY > b.y && mouseY < b.y + b.h
      ) {
        if (b.type === "resume" && typeof onResume === "function") {
          onResume();
        } else if (b.type === "restart" && typeof onRestart === "function") {
          onRestart();
        }
        return;
      }
    }
  }

  mousePressed(info) {
    // 1. Check Upgrade / Sell Buttons
    if (this.selectedTower && this.upgradeButtons.length > 0) {
      for (let btn of this.upgradeButtons) {
        if (!btn) continue;
        if (mouseX > btn.x && mouseX < btn.x + btn.w &&
            mouseY > btn.y && mouseY < btn.y + btn.h) {

          if (btn.type === 'sell') {
            this.sellSelectedTower(info);
          } else {
            this.upgradeManager.applyUpgrade(this.selectedTower, btn.type, info);
          }
          return; // Click was handled
        }
      }
    }

    // 2. Check Shop Palette (to start drag)
    for (let slot of this.paletteSlots) {
      if (!slot) continue;
      const d = dist(mouseX, mouseY, slot.x, slot.y);
      if (d < 25) {
        this.selectedTower = null; // Deselect tower to clear menu
        this.dragger.startDrag(slot.type, mouseX, mouseY);
        return;
      }
    }

    // 3. Check Placed Towers (Select a tower)
    let clickedATower = false;
    for (let i = this.placedTowers.length - 1; i >= 0; i--) {
      let t = this.placedTowers[i];
      if (!t) continue;

      if (dist(mouseX, mouseY, t.x, t.y) < 20) {
        this.selectedTower = t;
        clickedATower = true;
        return;
      }
    }

    // 4. Deselect (Clicked Empty Space)
    if (!this.dragger.draggingTower && !clickedATower) {
      this.selectedTower = null;
    }
  }

  mouseDragged() {
    this.dragger.updateDrag(mouseX, mouseY);
  }

  mouseMoved() {
    this.dragger.updateDrag(mouseX, mouseY);
  }

  mouseReleased(infoTracker) {
    this.dragger.endDrag(this.path, this.placedTowers, infoTracker);
  }
}
