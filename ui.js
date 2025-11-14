// UI.js
class UI {
  constructor(path, assets = {}) {
    this.path = path;

    // Map area where towers are allowed
    this.dropZone = { x: 0, y: 0, w: 1400, h: 500 };

    // Tower templates in the palette
    this.towerTypes = [
    { type: "basic", range: 120, damage: 10, rate: 0.5, cost: 25 },
    { type: "gatling", range: 100, damage: 3, rate: 0.1, cost: 50 },
    { type: "cannon", range: 150, damage: 50, rate: 1.5, cost: 75 },
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
  }

  // Draws palette, placed towers, and updates towers with enemies
  display(info, allEnemies) {
    // Do NOT draw the game background here; sketch.js owns that.

    // Palette tiles (boxes)
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
        circle(slot.x, slot.y, 30);
      } else if (slot.type === "gatling") {
        fill(0, 150, 0); // Green circle
        circle(slot.x, slot.y, 30);
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
      t.draw();
    }
  }

  // Mouse events forwarded from sketch.js
  mousePressed() {
    // Start dragging when clicking a palette icon
    for (let slot of this.paletteSlots) {
      const d = dist(mouseX, mouseY, slot.x, slot.y);
      if (d < 30 / 2 + 10) { // small hitbox padding
        this.dragger.startDrag(slot.type, mouseX, mouseY);
        break;
      }
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
