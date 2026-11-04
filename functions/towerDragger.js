class TowerDragger {
  constructor(towerTypes, dropZone, towerImages={}) {
    this.towerTypes = towerTypes;
    this.draggingTower = null;
    this.dropZone = dropZone;
    this._dragCost = 0;
    this.draggingTowerType = null; // Keep track of the type
    this._towerRadius = 15;
    this.blockedRects = []; // areas covered by HTML controls (shared with UI.reservedRects)
    this.cowboyTower = towerImages.cowboyTower;
    this.cannonTowerImg = towerImages.cannonTowerImg;
    this.sniperTowerImg = towerImages.sniperTowerImg;
    this.gatlingTowerImg = towerImages.gatlingTowerImg;
  }

  startDrag(towerType, startX, startY) {
    const base = this.towerTypes.find(t => t.type === towerType);
    if (!base) return;

    this.draggingTowerType = towerType; // Store the type
    this._dragCost = base.cost || 0;

    // Create an instance of the correct class (defined in UI.towerTypes)
    const towerInstance = base.create(startX, startY);

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

  // CHANGE: overlap helper (returns true if t's footprint overlaps an existing tower's)
  _overlaps(t, placedTowers) {
    if (!placedTowers || !placedTowers.length) return false;
    const r = t.radius ?? this._towerRadius;
    for (const p of placedTowers) {
      const dx = t.x - p.x;
      const dy = t.y - p.y;
      if (Math.hypot(dx, dy) < r + (p.radius ?? this._towerRadius)) return true;
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

  // Placement rules, shared by the preview and the actual drop so they always agree
  _isValidSpot(t, path, placedTowers) {
    const insideDrop = this._insideDrop(t.x, t.y);
    const onPath = path && typeof path.isOnPath === "function" ? path.isOnPath(t.x, t.y) : false;
    const overlapping = this._overlaps(t, placedTowers);
    const r = t.radius ?? this._towerRadius;
    const underControls = this.blockedRects.some(z =>
      t.x + r > z.x && t.x - r < z.x + z.w && t.y + r > z.y && t.y - r < z.y + z.h);
    return insideDrop && !onPath && !overlapping && !underControls;
  }

  endDrag(path, placedTowers, infoTracker) {
    if (!this.draggingTower) {
      this.draggingTowerType = null;
      return;
    }

    const t = this.draggingTower;

    if (!this._isValidSpot(t, path, placedTowers)) {
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
    sfx.play('place');
    effects.dust(t.x, t.y);
    effects.floatText(t.x, t.y, `-$${cost}`, gameSettings.colors().badText);
    this.draggingTower = null;
    this.draggingTowerType = null;
    this._dragCost = 0;
  }

  // 🔴 Show red ghost if not enough gold
  // UPDATED to show correct tower shape/color
  drawPreview(infoTracker, path, placedTowers) {
    if (!this.draggingTower) return;

    const t = this.draggingTower;
    const cost = this._dragCost || 0;

    const notEnoughGold = !!infoTracker && typeof infoTracker.currency === "number"
      ? infoTracker.currency < cost
      : false;

    // Same rules as endDrag: inside drop zone, off the path, not overlapping a tower
    const invalidSpot = !this._isValidSpot(t, path, placedTowers);

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

    // If invalid, override with the "bad" color (red, or the color-blind-safe one)
    if (useRed) {
      rangeColor = color(...gameSettings.colors().bad, 120);
      bodyColor = color(...gameSettings.colors().bad, 160);
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
  imageMode(CENTER);
  image(cannonTowerImg, t.x, t.y, 50, 70, 0, 0, 100, 0);

} else if (this.draggingTowerType === "sniper") {
  // Diamond shape (same as sniper tower)
  imageMode(CENTER);
  image(sniperTowerImg, t.x, t.y, 60, 80, 110, 0, 140, 0);

} else if (this.draggingTowerType == "basic") {
    imageMode(CENTER);
    image(cowboyTower, t.x,t.y,40,60,200,0,100,0)
} 

else if (this.draggingTowerType == "gatling") {
  imageMode(CENTER);
  image(gatlingTowerImg, t.x, t.y, 50, 80, 0, 0, 100, 0);
}
    pop();
  }
}
