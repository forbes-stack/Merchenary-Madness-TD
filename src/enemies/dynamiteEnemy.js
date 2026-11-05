// Explosive: when killed it bursts into 3 fast enemies (Runners)
class dynamiteEnemy extends GridEnemy {
  constructor(path) {
    super(path, 1.2, 150, 6, dynamiteEnemyImg);
    this.splitCount = 3;
  }

  /**
   * Enemies released when this one is killed (not when it escapes).
   * They start where it died, spaced out behind it along the path.
   */
  splitOnDeath() {
    const children = [];
    const prev = this.path[Math.max(this.pathIndex - 1, 0)];
    const back = createVector(prev.x - this.x, prev.y - this.y);
    const room = back.mag();
    if (room > 0) back.normalize();

    for (let i = 0; i < this.splitCount; i++) {
      const child = new fastEnemy(this.path);
      const offset = Math.min(i * 14, room); // don't step back past the previous waypoint
      child.x = this.x + back.x * offset;
      child.y = this.y + back.y * offset;
      child.pathIndex = this.pathIndex;
      children.push(child);
    }
    return children;
  }
}
