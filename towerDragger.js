// TowerDragger.js
class TowerDragger {
  constructor(towerTypes, dropZone) {
    this.towerTypes = towerTypes;
    this.draggingTower = null;
    this.dropZone = dropZone;
    this._dragCost = 0;

    // CHANGE: default collision radius per tower (visual circle is 30px → radius 15)
    // If your Tower class already has a radius/size, use that instead.
    this._towerRadius = 15;
  }

  startDrag(towerType, startX, startY) {
    const base = this.towerTypes.find(t => t.type === towerType);
    if (!base) return;

    this.draggingTower = new Tower(startX, startY, base.range, base.damage, base.rate);
    this._dragCost = base.cost || 0;
    this.draggingTower.cost = this._dragCost; // optional

    // CHANGE: ensure the ghost knows its collision radius (if Tower doesn't already)
    if (this.draggingTower && this.draggingTower.radius == null) {
      this.draggingTower.radius = this._towerRadius;
    }
  }

  updateDrag(x, y) {
    if (this.draggingTower) { this.draggingTower.x = x; this.draggingTower.y = y; }
  }

  // CHANGE: overlap helper (returns true if overlapping an existing tower)
  _overlaps(t, placedTowers, minSepPx = 30) {
    if (!placedTowers || !placedTowers.length) return false;
    for (const p of placedTowers) {
      const dx = t.x - p.x;
      const dy = t.y - p.y;
      if (Math.hypot(dx, dy) < minSepPx) return true;
    }
    return false;
  }

  // CHANGE: inside-drop helper
  _insideDrop(x, y) {
    return (
      x > this.dropZone.x && x < this.dropZone.x + this.dropZone.w &&
      y > this.dropZone.y && y < this.dropZone.y + this.dropZone.h
    );
  }

  endDrag(path, placedTowers, infoTracker) {
    if (!this.draggingTower) return;

    const t = this.draggingTower;

    // ORIGINAL:
    // const insideDrop =
    //   t.x > this.dropZone.x && t.x < this.dropZone.x + this.dropZone.w &&
    //   t.y > this.dropZone.y && t.y < this.dropZone.y + this.dropZone.h;
    // const validSpot = insideDrop && !path.isOnPath(t.x, t.y);

    // CHANGE: also forbid overlapping with existing towers
    const insideDrop = this._insideDrop(t.x, t.y);
    const onPath = path && typeof path.isOnPath === "function" ? path.isOnPath(t.x, t.y) : false;
    const overlapping = this._overlaps(t, placedTowers, (t.radius ?? this._towerRadius) * 2);
    const validSpot = insideDrop && !onPath && !overlapping;

    if (!validSpot) {
      // CANCEL placement quietly
      this.draggingTower = null;
      this._dragCost = 0;
      return;
    }

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

  // 🔴 Show red ghost if invalid (gold, path, outside zone, or overlapping)
  // CHANGE: added placedTowers to preview so we can detect overlaps live
  drawPreview(infoTracker, path, placedTowers) {
    if (!this.draggingTower) return;

    const t = this.draggingTower;
    const cost = this._dragCost || 0;

    const notEnoughGold = !!infoTracker && typeof infoTracker.currency === "number"
      ? infoTracker.currency < cost
      : false;

    // CHANGE: compute invalid placement status
    const insideDrop = this._insideDrop(t.x, t.y);
    const onPath = path && typeof path.isOnPath === "function" ? path.isOnPath(t.x, t.y) : false;
    const overlapping = this._overlaps(t, placedTowers, (t.radius ?? this._towerRadius) * 2);
    const invalidSpot = !insideDrop || onPath || overlapping;

    const useRed = notEnoughGold || invalidSpot;

    // Draw ghost
    push();
    // range ring
    noFill();
    stroke(useRed ? color(255, 0, 0, 120) : color(0, 0, 255, 60));
    circle(t.x, t.y, t.range * 2);

    // body
    noStroke();
    fill(useRed ? color(255, 0, 0, 160) : color(100, 100, 255, 160));
    circle(t.x, t.y, (t.radius ?? this._towerRadius) * 2); // stays 30px by default
    pop();

    // OPTIONAL (debug): draw a subtle warning text when overlapping
    // if (overlapping) {
    //   push(); fill(255,0,0); noStroke(); textSize(12);
    //   text("Can't place: overlaps another tower", t.x + 18, t.y - 18); pop();
    // }
  }
}
