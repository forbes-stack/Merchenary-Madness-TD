// Armored: every hit does `armor` less damage (always at least 1)
class ironcladEnemy extends GridEnemy {
  constructor(path) {
    super(path, 0.7, 300, 12, ironcladEnemyImg);
    this.armor = 5;
  }

  takeDamage(amount, infoTracker) {
    super.takeDamage(Math.max(1, amount - this.armor), infoTracker);
  }
}
