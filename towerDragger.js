// TowerDragger.js
class TowerDragger {
  constructor(towerTypes) {
    this.towerTypes = towerTypes; // array of available tower templates
    this.draggingTower = null;
  }

  startDrag(towerType, startX, startY) {
    // Create a copy of the selected tower type for dragging
    let base = this.towerTypes.find(t => t.type === towerType);
    if (base) {
      this.draggingTower = new Tower(startX, startY, base.range, base.damage, base.type);
    }
  }

  updateDrag(x, y) {
    if (this.draggingTower) {
      this.draggingTower.x = x;
      this.draggingTower.y = y;
    }
  }

  endDrag(path, placedTowers) {
    if (this.draggingTower && path.isOnPath(this.draggingTower.x, this.draggingTower.y)) {
      placedTowers.push(this.draggingTower);
    }
    this.draggingTower = null; // stop dragging
  }

  drawPreview() {
    if (this.draggingTower) {
      push();
      fill(0, 255, 0, 100);
      ellipse(this.draggingTower.x, this.draggingTower.y, 30);
      pop();
    }
  }
}
