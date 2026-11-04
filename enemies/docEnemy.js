// Regen: heals itself while walking, up to its max health
class docEnemy extends GridEnemy {
  constructor(path) {
    super(path, 0.8, 200, 8, docEnemyImg);
    this.regenPerSecond = 10;
  }

  update(infoTracker) {
    super.update(infoTracker);
    if (this.alive) {
      // one update = one frame (60 per second at 1x)
      this.health = Math.min(this.maxHealth, this.health + this.regenPerSecond / 60);
    }
  }
}
