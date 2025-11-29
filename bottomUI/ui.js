// UI.js
class UI {
  constructor(path, assets = {}) {
    this.path = path;

    // Map area where towers are allowed
    this.dropZone = { x: 0, y: 0, w: 1400, h: 500 };

    // Tower templates in the palette
    this.towerTypes = [
    { type: "basic", range: 120, damage: 10, rate: 0.5, cost: 25 },
    { type: "gatling", range: 100, damage: 3, rate: 0.1, cost: 75 },
    { type: "cannon", range: 150, damage: 50, rate: 1.5, cost: 125 },
    // add more types with their own cost...
    ];

    // Palette tile centers
    this.paletteSlots = [
      { x: 75, y: 550, type: "basic" },
      { x: 225, y: 550, type: "gatling" },
      { x: 375, y: 550, type: "cannon" },
      // { x: 200, y: 550, type: "slow" },
    ];

    this.placedTowers = [];

    // Drag helper (expects TowerDragger to be loaded)
    this.dragger = new TowerDragger(this.towerTypes, this.dropZone);

    this.bg = assets.bg;   // optional, not drawn here
    this.uiBg = assets.uiBg;
    this.gattlingIcon = assets.gattlingIcon;
    this.cowboyIcon = assets.cowboyIcon;

    //Upgrade UI
     this.selectedTower = null;
    // Position the upgrade panel near the HUD
    this.upgradePanel = { x: 1100, y: 525, w: 250, h: 200 };
    // This will be dynamically set when the panel is drawn
    this.upgradeButtonRect = { x: 0, y: 0, w: 0, h: 0 };
  }

  // Draws the upgrade panel for the selected tower
  drawUpgradeUI(info) {
    if (!this.selectedTower) return;

    let panel = this.upgradePanel;
    let tower = this.selectedTower;

    push();

    // Panel background
    fill(50, 50, 50, 200); // Dark semi-transparent
    stroke(255, 223, 0); // Gold border
    strokeWeight(2);
    rect(panel.x, panel.y, panel.w, panel.h, 10);

    // Tower Type
    fill(255);
    noStroke();
    textSize(22);
    textAlign(CENTER, TOP);
    let towerName = tower.towerType.charAt(0).toUpperCase() + tower.towerType.slice(1);
    text(`${towerName} Tower`, panel.x + panel.w / 2, panel.y + 15);

    // Tower Level
    textSize(18);
    fill(200);
    text(`Level: ${tower.level}`, panel.x + panel.w / 2, panel.y + 45);

    // Upgrade Button
    if (tower.isMaxLevel()) {
      fill(150);
      textAlign(CENTER, CENTER);
      textSize(18);
      text("Max Level", panel.x + panel.w / 2, panel.y + 115);
    } else {
      let cost = tower.getNextUpgradeCost();
      let hasEnoughGold = info.currency >= cost;

      // Define the button's position
      this.upgradeButtonRect = {
        x: panel.x + 25,
        y: panel.y + 90,
        w: panel.w - 50,
        h: 50
      };

      // Button background
      if (hasEnoughGold) {
        fill(0, 150, 0); // Green
      } else {
        fill(150, 0, 0); // Red
      }
      stroke(255);
      strokeWeight(1);
      rect(this.upgradeButtonRect.x, this.upgradeButtonRect.y, this.upgradeButtonRect.w, this.upgradeButtonRect.h, 5);

      // Button Text
      fill(255);
      noStroke();
      textSize(18);
      textAlign(CENTER, CENTER);
      // Center text vertically
      text("Upgrade", this.upgradeButtonRect.x + this.upgradeButtonRect.w / 2, this.upgradeButtonRect.y + 25);

      // Cost Text (Gold or Red)
      fill(hasEnoughGold ? [255, 223, 0] : [255, 100, 100]);
      textSize(16);
      text(`$${cost}`, this.upgradeButtonRect.x + this.upgradeButtonRect.w / 2, this.upgradeButtonRect.y + 65);
    }

    pop();
  }

  display(info, allEnemies) {
    // (palette drawing unchanged)

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
      const base = this.towerTypes.find(t => t.type === slot.type);
      if (!base) continue;

      push();
      noStroke();
      if (slot.type === "basic") {
        fill(100, 100, 255); // Blue circle
        imageMode(CENTER);
image(this.cowboyIcon, slot.x, slot.y, 50, 50);
      } else if (slot.type === "gatling") {
        fill(0, 150, 0); // Green circle
imageMode(CENTER);
image(this.gattlingIcon, slot.x, slot.y, 50, 50);
        // circle(slot.x, slot.y, 30); edited out for now
      } else if (slot.type === "cannon") {
        fill(0, 0, 200); // Blue triangle
        let r = 18;
        triangle(
          slot.x, slot.y - r*0.8,
          slot.x - r, slot.y + r * 0.6,
          slot.x + r, slot.y + r * 0.6
        );
      }
      pop();

      const cost = base.cost;
      let hasEnoughGold = false;
      // Check if info object exists and has currency
      if (info && typeof info.currency === 'number') {
        hasEnoughGold = info.currency >= cost;
      }

      // Costs displayed under tower tiles.
      push();
      textAlign(CENTER, TOP);
      textSize(16);
      noStroke();

      // Set color based on currency
      if (hasEnoughGold) {
        fill(255, 223, 0); // Gold
      } else {
        fill(255, 0, 0); // Red
      }

      // Draw text below the icon
      // Icon is at slot.y (550). Let's add 25px to put it below.
      text(`$${cost}`, slot.x, slot.y + 25);
      pop();
    }

    // Placed towers: update once with the whole enemy array, then draw
    for (let t of this.placedTowers) {
      if (allEnemies && info) {
        t.update(allEnemies, info);
      }
      t.draw();
    }

    // Draw selection and upgrade UI
    if (this.selectedTower) {
      this.selectedTower.drawSelection();
      this.drawUpgradeUI(info); // Pass info for currency check
    }

    // --- Dragging preview (ghost tower + range) ---
    this.dragger.drawPreview(info, this.path);   // ← pass info + path
  }

  displayGameOver() {
    // Just draw the palette and towers (no updates)

    const boxes = [
      [50, 525], [50, 625], [200, 525], [200, 625],
      [350, 525], [350, 625], [500, 525], [500, 625],
      [650, 525], [650, 625], [800, 525], [800, 625],
      [950, 525], [950, 625]
    ];
    for (let [x, y] of boxes) {
      rect(x, y, 50, 50);
    }

    for (let slot of this.paletteSlots) {
      const base = this.towerTypes.find(t => t.type === slot.type);
      if (!base) continue;
      push();
      noStroke();
      fill(100, 100, 255);
      circle(slot.x, slot.y, 30);
      pop();
    }

    // No info object here, so just draw cost in a neutral color
      const cost = base.cost;
      push();
      textAlign(CENTER, TOP);
      textSize(16);
      noStroke();
      fill(200); // Neutral grey/white
      text(`$${cost}`, slot.x, slot.y + 25);
      pop();


    for (let t of this.placedTowers) {
      if (allEnemies && info) {
        t.update(allEnemies, info);
      }
      t.draw();
    }

    // --- Dragging preview (ghost tower + range) ---
    // ORIGINAL:
    // this.dragger.drawPreview(info, this.path);
    // CHANGE: pass placedTowers so the preview can flag overlap in red
    this.dragger.drawPreview(info, this.path, this.placedTowers);
  }

  displayGameOver() {
    // (unchanged visual-only drawing)

    const boxes = [
      [50, 525], [50, 625], [200, 525], [200, 625],
      [350, 525], [350, 625], [500, 525], [500, 625],
      [650, 525], [650, 625], [800, 525], [800, 625],
      [950, 525], [950, 625]
    ];
    for (let [x, y] of boxes) rect(x, y, 50, 50);

    for (let slot of this.paletteSlots) {
      const base = this.towerTypes.find(t => t.type === slot.type);
      if (!base) continue;
      push(); noStroke(); fill(100, 100, 255); circle(slot.x, slot.y, 30); pop();
    }

    for (let t of this.placedTowers) t.draw();
  }

  mousePressed(info) {
    // 1. Check for upgrade button click first
    if (this.selectedTower && !this.selectedTower.isMaxLevel()) {
      let btn = this.upgradeButtonRect;
      if (mouseX > btn.x && mouseX < btn.x + btn.w && mouseY > btn.y && mouseY < btn.y + btn.h) {

        // This calls the tower's upgrade method, which uses UpgradeManager
        this.selectedTower.upgrade(info);

        return; // Click was handled
      }
    }

    // 2. Check for shop palette click (to start drag)
    for (let slot of this.paletteSlots) {
      const d = dist(mouseX, mouseY, slot.x, slot.y);
      if (d < 30 / 2 + 10) { // small hitbox padding
        this.selectedTower = null; // Deselect tower when buying a new one
        this.dragger.startDrag(slot.type, mouseX, mouseY);
        return; // Click was handled
      }
    }

    // 3. Check for click on a placed tower
    // Iterate backwards so we select the one on top
    for (let i = this.placedTowers.length - 1; i >= 0; i--) {
      let t = this.placedTowers[i];
      // Use a 30px diameter for clicking
      const d = dist(mouseX, mouseY, t.x, t.y);
      if (d < 15) { // 15px radius
        this.selectedTower = t;
        return; // Click was handled
      }
    }

    // 4. If we clicked anywhere else (and not dragging), deselect
    if (!this.dragger.draggingTower) {
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
