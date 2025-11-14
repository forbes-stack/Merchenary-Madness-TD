// UI.js
class UI {
  constructor(path, assets = {}) {
    this.path = path;

    // Map area where towers are allowed
    this.dropZone = { x: 0, y: 0, w: 1400, h: 500 };

    // Tower templates in the palette
    this.towerTypes = [
      { type: "basic", range: 120, damage: 10, rate: 0.5, cost: 25 },
      // add more types with their own cost...
    ];

    // Palette tile centers
    this.paletteSlots = [
      { x: 75, y: 550, type: "basic" },
      // { x: 200, y: 550, type: "slow" },
    ];

    this.placedTowers = [];

    // Drag helper (expects TowerDragger to be loaded)
    this.dragger = new TowerDragger(this.towerTypes, this.dropZone);

    this.bg = assets.bg;   // optional, not drawn here
    this.uiBg = assets.uiBg;
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

    for (let slot of this.paletteSlots) {
      const base = this.towerTypes.find(t => t.type === slot.type);
      if (!base) continue;
      push();
      noStroke();
      fill(100, 100, 255);
      circle(slot.x, slot.y, 30);
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

  mousePressed() {
    for (let slot of this.paletteSlots) {
      const d = dist(mouseX, mouseY, slot.x, slot.y);
      if (d < 30 / 2 + 10) {
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
