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
      { type: "cannon",  range: 150, damage: 50, rate: 1.25, cost: 100 },
      { type: "sniper",  range: 20,  damage: 75, rate: 1.5, cost: 150 },
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
        type: type // 'damage' or 'rate'
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

    // --- Damage Path Slot (Y Offset: 0) ---
    if (options.damage) {
      drawBtn(0, "Upgr Dmg", options.damage.cost, 'damage');
    } else if (t.upgradePath === 'rate' && !t.isMaxLevel()) {
      drawLocked(0);
    }

    // --- Rate Path Slot (Y Offset: 40) ---
    let yOffset = (options.damage || (t.upgradePath === 'rate' && !t.isMaxLevel())) ? 40 : 0;

    if (options.rate) {
      drawBtn(yOffset, "Upgr Rate", options.rate.cost, 'rate');
    } else if (t.upgradePath === 'damage' && !t.isMaxLevel()) {
      drawLocked(yOffset);
    }

    // --- Max Level Message ---
    if (t.isMaxLevel()) {
      push();
      fill(255, 215, 0);
      textAlign(CENTER);
      text("MAX LEVEL", t.x, startY + 20);
      pop();
    }
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

  mousePressed(info) {
    // 1. Check Upgrade Buttons
    if (this.selectedTower && this.upgradeButtons.length > 0) {
      for (let btn of this.upgradeButtons) {
        if (!btn) continue;
        if (mouseX > btn.x && mouseX < btn.x + btn.w &&
            mouseY > btn.y && mouseY < btn.y + btn.h) {

          this.upgradeManager.applyUpgrade(this.selectedTower, btn.type, info);
          return; // Click was handled (upgrade button pressed)
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
