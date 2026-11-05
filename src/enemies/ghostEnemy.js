// Camo: only Snipers, and towers within a Sniper's spotter range, can target it.
// Cannon splash can't hit it (only a direct hit from a tower that can see it).
class ghostEnemy extends GridEnemy {
  constructor(path) {
    super(path, 1.5, 80, 6, ghostEnemyImg);
    this.camo = true;
    this.alpha = 140; // drawn see-through so the player can tell it's camo
  }
}
