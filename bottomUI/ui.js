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
    {type: "sniper", range: 20, damage: 75, rate: 1.5, cost: 100},
    // add more types with their own cost...
    ];

    // Palette tile centers
    this.paletteSlots = [
      { x: 75, y: 550, type: "basic" },
      { x: 225, y: 550, type: "gatling" },
      { x: 375, y: 550, type: "cannon" },
      { x: 525, y: 550, type: "sniper"}
      // { x: 200, y: 550, type: "slow" },
    ];

    this.placedTowers = [];

    // Drag helper (expects TowerDragger to be loaded)
    this.dragger = new TowerDragger(this.towerTypes, this.dropZone);

    this.bg = assets.bg;
    this.uiBg = assets.uiBg;
    this.gattlingIcon = assets.gattlingIcon;
    this.cowboyIcon = assets.cowboyIcon;

    // Upgrade Management
    this.upgradeManager = new UpgradeManager();
    this.selectedTower = null;

    // Store button hitboxes here for mousePressed
    this.upgradeButtons = [];
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
        fill(100); stroke(255); rect(t.x - (btnW/2), startY + offsetY, btnW, btnH, 5);
        fill(200); noStroke(); textAlign(CENTER, CENTER); textSize(12);
        text("Path Locked", t.x, startY + offsetY + btnH/2);
        pop();
    }

    // --- Damage Path Slot (Y Offset: 0) ---
    if (options.damage) {
      drawBtn(0, "Upgr Dmg", options.damage.cost, 'damage');
    } else if (t.upgradePath === 'rate' && !t.isMaxLevel()) {
      drawLocked(0);
    }

    // --- Rate Path Slot (Y Offset: 40) ---
    // If anything occupies the first slot (damage button or damage lock), push this down
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
    // This prevents "ghost buttons" from blocking clicks when the menu is closed.
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
        // Ensure image is loaded before drawing
        if (this.cowboyIcon) image(this.cowboyIcon, slot.x, slot.y, 50, 50);
        else circle(slot.x, slot.y, 30);
      } else if (slot.type === "gatling") {
        fill(0, 150, 0);
        imageMode(CENTER);
        if (this.gattlingIcon) image(this.gattlingIcon, slot.x, slot.y, 50, 50);
        else circle(slot.x, slot.y, 30);
      } else if (slot.type === "cannon") {
        fill(0, 0, 200);
        let r = 18;
        triangle(slot.x, slot.y - r * 0.8, slot.x - r, slot.y + r * 0.6, slot.x + r, slot.y + r * 0.6);
      } else if (slot.type === "sniper") {
        push();
  fill(255, 200, 0);
  noStroke();

  // scaled-down diamond (about 60% size)
  const r = 20;

  beginShape();
  vertex(slot.x,       slot.y - r);
  vertex(slot.x - r,   slot.y);
  vertex(slot.x,       slot.y + r);
  vertex(slot.x + r,   slot.y);
  endShape(CLOSE);

  pop();
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

      if (hasEnoughGold) {
        fill(255, 223, 0);
      } else {
        fill(255, 0, 0);
      }

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
      // Check if the selected tower still exists
      if (!this.placedTowers.includes(this.selectedTower)) {
         this.selectedTower = null;
      } else {
         this.selectedTower.drawSelection();
         this.drawUpgradeUI(info);
      }
    }

    // --- Dragging preview (ghost tower + range) ---
    // CRITICAL: Must pass placedTowers so overlap is checked
    this.dragger.drawPreview(info, this.path, this.placedTowers);
  }

  displayGameOver() {
    // Only visual drawing in Game Over state
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

      const cost = base.cost;
      push();
      textAlign(CENTER, TOP);
      textSize(16);
      noStroke();
      fill(200);
      text(`$${cost}`, slot.x, slot.y + 25);
      pop();
    }

    for (let t of this.placedTowers) {
      if(t) t.draw();
    }
  }

  mousePressed(info) {
    // 1. Check Upgrade Buttons (CRITICAL FIX: Iterate over array, not a single variable)
    if (this.selectedTower && this.upgradeButtons.length > 0) {
      for (let btn of this.upgradeButtons) {
        if (!btn) continue; // Safety Check
        if (mouseX > btn.x && mouseX < btn.x + btn.w &&
            mouseY > btn.y && mouseY < btn.y + btn.h) {

          this.upgradeManager.applyUpgrade(this.selectedTower, btn.type, info);
          return; // Click was handled (upgrade button pressed)
        }
      }
    }

    // 2. Check Shop Palette (to start drag)
    for (let slot of this.paletteSlots) {
      if (!slot) continue; // Safety Check
      const d = dist(mouseX, mouseY, slot.x, slot.y);
      if (d < 25) {
        this.selectedTower = null; // CRITICAL: Deselect tower to clear menu
        this.dragger.startDrag(slot.type, mouseX, mouseY);
        return; // Click was handled (started drag)
      }
    }

    // 3. Check Placed Towers (Select a tower)
    let clickedATower = false;
    for (let i = this.placedTowers.length - 1; i >= 0; i--) {
      let t = this.placedTowers[i];
      if (!t) continue; // Safety Check

      if (dist(mouseX, mouseY, t.x, t.y) < 20) {
        this.selectedTower = t;
        clickedATower = true;
        return; // Click was handled (selected tower)
      }
    }

    // 4. Deselect (Clicked Empty Space)
    // If we are not dragging, and we didn't click a tower, clear selection
    if (!this.dragger.draggingTower && !clickedATower) {
      this.selectedTower = null; // CRITICAL: Deselect to clear menu
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
