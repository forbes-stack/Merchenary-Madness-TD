// TowerDragger.js
class TowerDragger {
  constructor(towerTypes, dropZone) {
    this.towerTypes = towerTypes;   // [{type, range, damage, rate, color?}, ...]
    this.draggingTower = null;      // instance of Tower while dragging
    this.dropZone = dropZone;       // {x,y,w,h}
  }

  startDrag(towerType, startX, startY) {
    const base = this.towerTypes.find(t => t.type === towerType);
    if (!base) return;

    // Create a *real* Tower for preview & eventual placement
    this.draggingTower = new Tower(
      startX,
      startY,
      base.range,
      base.damage,
      base.rate
    );
  }

  updateDrag(x, y) {
    if (this.draggingTower) {
      this.draggingTower.x = x;
      this.draggingTower.y = y;
    }
  }

  endDrag(path, placedTowers) {
    if (!this.draggingTower) return;

    const t = this.draggingTower;
    const insideDrop =
      t.x > this.dropZone.x && t.x < this.dropZone.x + this.dropZone.w &&
      t.y > this.dropZone.y && t.y < this.dropZone.y + this.dropZone.h;

    // ✅ Only place if inside drop zone AND NOT on the path
    if (insideDrop && !path.isOnPath(t.x, t.y)) {
      placedTowers.push(t);
    } else {
      // optional feedback
      // console.log("❌ Invalid placement (outside drop zone or on the path).");
    }

    this.draggingTower = null;
  }

  drawPreview() {
    if (!this.draggingTower) return;

    // If you added Tower.drawGhost():
    if (typeof this.draggingTower.drawGhost === "function") {
      this.draggingTower.drawGhost();
      return;
    }

    // Otherwise, draw a ghost preview here without touching Tower:
    push();
    // range ring
    noFill();
    stroke(0, 0, 255, 60);
    circle(this.draggingTower.x, this.draggingTower.y, this.draggingTower.range * 2);
    // body
    noStroke();
    fill(100, 100, 255, 160);
    circle(this.draggingTower.x, this.draggingTower.y, 30);
    pop();
  }
}
