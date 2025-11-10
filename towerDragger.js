// TowerDragger.js
class TowerDragger {
  constructor(towerTypes, dropZone) {
    this.towerTypes = towerTypes;
    this.draggingTower = null;
    this.dropZone = dropZone;
    this._dragCost = 0;
  }

  startDrag(towerType, startX, startY) {
    const base = this.towerTypes.find(t => t.type === towerType);
    if (!base) return;

    this.draggingTower = new Tower(startX, startY, base.range, base.damage, base.rate);
    this._dragCost = base.cost || 0;
    this.draggingTower.cost = this._dragCost; // optional
  }

  updateDrag(x, y) {
    if (this.draggingTower) { this.draggingTower.x = x; this.draggingTower.y = y; }
  }

  endDrag(path, placedTowers, infoTracker) {
    if (!this.draggingTower) return;

    const t = this.draggingTower;
    const insideDrop =
      t.x > this.dropZone.x && t.x < this.dropZone.x + this.dropZone.w &&
      t.y > this.dropZone.y && t.y < this.dropZone.y + this.dropZone.h;

    const validSpot = insideDrop && !path.isOnPath(t.x, t.y);
    if (!validSpot) { this.draggingTower = null; this._dragCost = 0; return; }

    const cost = this._dragCost || 0;
    const paid = infoTracker && typeof infoTracker.decreaseCurrency === "function"
      ? infoTracker.decreaseCurrency(cost)
      : true; // if no tracker, allow (dev mode)

    if (!paid) { // not enough gold -> CANCEL placement
      this.draggingTower = null;
      this._dragCost = 0;
      return;
    }

    placedTowers.push(t);
    this.draggingTower = null;
    this._dragCost = 0;
  }

  // 🔴 Show red ghost if not enough gold (keeps normal preview otherwise)
  drawPreview(infoTracker, path) {
    if (!this.draggingTower) return;

    const t = this.draggingTower;
    const cost = this._dragCost || 0;
    const notEnoughGold = !!infoTracker && typeof infoTracker.currency === "number"
      ? infoTracker.currency < cost
      : false;

    // (Optional) also factor in invalid placement: outside drop zone or on path
    // const insideDrop = t.x > this.dropZone.x && t.x < this.dropZone.x + this.dropZone.w &&
    //                    t.y > this.dropZone.y && t.y < this.dropZone.y + this.dropZone.h;
    // const invalidSpot = !insideDrop || (path && path.isOnPath(t.x, t.y));

    // If you want red ONLY for "not enough gold":
    const useRed = notEnoughGold;

    // Draw ghost manually so we can tint it
    push();
    // range ring
    noFill();
    stroke(useRed ? color(255, 0, 0, 120) : color(0, 0, 255, 60));
    circle(t.x, t.y, t.range * 2);

    // body
    noStroke();
    fill(useRed ? color(255, 0, 0, 160) : color(100, 100, 255, 160));
    circle(t.x, t.y, 30);
    pop();
  }
}
