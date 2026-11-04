// Armored: only Cannons (direct hits and splash) can hurt it, and its armor still
// takes `armor` off every Cannon hit (always at least 1). Other towers will shoot at
// it, but their bullets just clink off the plate.
class ironcladEnemy extends GridEnemy {
  constructor(path) {
    super(path, 0.7, 300, 12, ironcladEnemyImg);
    this.armor = 5;
    this._lastImmuneText = -Infinity; // frame of the last "IMMUNE" popup
  }

  takeDamage(amount, infoTracker, source) {
    if (!source || source.towerType !== "cannon") {
      sfx.play("clink");
      // occasional popup so players learn why it isn't dying (not every bullet)
      if (frameCount - this._lastImmuneText > 90) {
        this._lastImmuneText = frameCount;
        effects.floatText(this.x, this.y - 10, "IMMUNE", [200, 200, 210]);
      }
      return;
    }
    super.takeDamage(Math.max(1, amount - this.armor), infoTracker, source);
  }
}
