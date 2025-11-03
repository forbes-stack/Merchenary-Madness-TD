// UI.js
class UI {
  constructor(path, assets = {}) {
    this.path = path;

    // Map area where towers are allowed
    this.dropZone = { x: 0, y: 0, w: 1400, h: 500 };

    // Define available tower templates shown in the palette
    // (tune these numbers as you like)
    this.towerTypes = [
      { type: "basic", range: 120, damage: 1, rate: 0.5 },
      // Add more: { type: "slow", range: 140, damage: 0.5, rate: 0.8 }, ...
    ];

    // Palette slots (tile centers) => which tower type each tile represents
    this.paletteSlots = [
      { x: 75,  y: 550, type: "basic" },
      // e.g. { x: 200, y: 550, type: "slow" },
    ];

    this.placedTowers = [];

    // Compose the dragger with the templates and drop zone
    this.dragger = new TowerDragger(this.towerTypes, this.dropZone);

    this.bg = assets.bg;   // optional background image
    this.uiBg = assets.uiBg;
  }

  display() {
    background(220);
    if (this.bg) {
      image(this.bg, 0, 0, windowWidth, windowHeight - 200);
    }

    // (Optional) visualize drop zone while testing
    // push(); noFill(); stroke(0,120); rect(this.dropZone.x, this.dropZone.y, this.dropZone.w, this.dropZone.h); pop();

    // --- Palette tiles (boxes) ---
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

    // --- Palette icons (render each slot’s tower type) ---
    for (let slot of this.paletteSlots) {
      const base = this.towerTypes.find(t => t.type === slot.type);
      if (!base) continue;

      // simple icon: a circle matching tower body style
      push();
      noStroke();
      fill(100, 100, 255);      // same color as Tower.draw()
      circle(slot.x, slot.y, 30);
      pop();
    }

    // --- Placed towers ---
    for (let t of this.placedTowers) {
      t.draw();
    }

    // --- Dragging preview (ghost tower + range) ---
    this.dragger.drawPreview();
  }

  // Hook these up to p5’s global mouse callbacks
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

  mouseReleased() {
    this.dragger.endDrag(this.path, this.placedTowers);
  }
}
