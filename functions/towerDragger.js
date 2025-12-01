class TowerDragger {
  constructor(towerTypes, dropZone) {
    this.towerTypes = towerTypes;
    this.draggingTower = null;
    this.dropZone = dropZone;
    this._dragCost = 0;
    this.draggingTowerType = null; // Keep track of the type
    this._towerRadius = 15;
  }

  startDrag(towerType, startX, startY) {
    const base = this.towerTypes.find(t => t.type === towerType);
    if (!base) return;

    this.draggingTowerType = towerType; // Store the type
    this._dragCost = base.cost || 0;

    let towerInstance;

    // Create an instance of the correct class
    if (towerType === "basic") {
      towerInstance = new Tower(startX, startY, base.range, base.damage, base.rate);
    } else if (towerType === "gatling") {
      towerInstance = new GatlingGunTower(startX, startY);
    } else if (towerType === "cannon") {
      towerInstance = new CannonTower(startX, startY);
    } else if (towerType === "sniper") {
      towerInstance = new SniperTower(startX, startY);
    } else {
      // Fallback just in case
      towerInstance = new Tower(startX, startY, base.range, base.damage, base.rate);
    }

    towerInstance.towerType = towerType;
    this.draggingTower = towerInstance;
    this.draggingTower.cost = this._dragCost;

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
    if (!this.draggingTower) {
      this.draggingTowerType = null;
      return;
    }

    const t = this.draggingTower;
    const insideDrop = this._insideDrop(t.x, t.y);
    const onPath = path && typeof path.isOnPath === "function" ? path.isOnPath(t.x, t.y) : false;
    const overlapping = this._overlaps(t, placedTowers, (t.radius ?? this._towerRadius) * 2);
    const validSpot = insideDrop && !onPath && !overlapping;

    if (!validSpot) {
      // CANCEL placement quietly
      this.draggingTower = null;
      this.draggingTowerType = null;
      this._dragCost = 0;
      return;
    }

    const cost = this._dragCost || 0;
    const paid = infoTracker && typeof infoTracker.decreaseCurrency === "function"
      ? infoTracker.decreaseCurrency(cost)
      : true; // if no tracker, allow (dev mode)

    if (!paid) { // not enough gold -> CANCEL placement
      this.draggingTower = null;
      this.draggingTowerType = null;
      this._dragCost = 0;
      return;
    }

    placedTowers.push(t);
    this.draggingTower = null;
    this.draggingTowerType = null;
    this._dragCost = 0;
  }

  // 🔴 Show red ghost if not enough gold
  // UPDATED to show correct tower shape/color
  drawPreview(infoTracker, path) {
    if (!this.draggingTower) return;

    const t = this.draggingTower;
    const cost = this._dragCost || 0;

    const notEnoughGold = !!infoTracker && typeof infoTracker.currency === "number"
      ? infoTracker.currency < cost
      : false;

    // (Optional) also factor in invalid placement: outside drop zone or on path
    const insideDrop = t.x > this.dropZone.x && t.x < this.dropZone.x + this.dropZone.w &&
      t.y > this.dropZone.y && t.y < this.dropZone.y + this.dropZone.h;
    const invalidSpot = !insideDrop || (path && path.isOnPath(t.x, t.y, 20)); // 20px buffer

    const useRed = notEnoughGold || invalidSpot;

    // --- Define colors ---
    let rangeColor, bodyColor;

    // Base colors on tower type
    if (this.draggingTowerType === "gatling") {
      rangeColor = color(0, 150, 0, 60); // Green
      bodyColor = color(0, 150, 0, 160);
    } else if (this.draggingTowerType === "cannon") {
      rangeColor = color(0, 0, 200, 60); // Blue
      bodyColor = color(0, 0, 200, 160);
    } else { // Basic
      rangeColor = color(0, 0, 255, 60); // Default blue
      bodyColor = color(100, 100, 255, 160);
    }

    // If invalid, override with red
    if (useRed) {
      rangeColor = color(255, 0, 0, 120);
      bodyColor = color(255, 0, 0, 160);
    }

    // Draw ghost
    push();

    // range ring
    noFill();
    stroke(rangeColor);
    strokeWeight(1);
    circle(t.x, t.y, t.range * 2);

    // body
    noStroke();
    fill(bodyColor);

    // Draw correct shape based on type
if (this.draggingTowerType === "cannon") {
  let r = 18;
  triangle(
    t.x, t.y - r,
    t.x - r, t.y + r * 0.5,
    t.x + r, t.y + r * 0.5
  );

} else if (this.draggingTowerType === "sniper") {
  // Diamond shape (same as sniper tower)
  const r = 15;
  beginShape();
  vertex(t.x,       t.y - r);
  vertex(t.x - r,   t.y);
  vertex(t.x,       t.y + r);
  vertex(t.x + r,   t.y);
  endShape(CLOSE);

} else {
  // Gatling + Basic are circles
  circle(t.x, t.y, 30);
}


    pop();


  }
}
