// Tower.js
class Tower {
  constructor(x, y, range, damage, rate) {
    this.x = x;
    this.y = y;
    this.range = range;
    this.damage = damage;
    this.rate = rate;
    this.cooldown = 0; // frames until next shot
  }

  // Takes an ARRAY of enemies + the InfoTracker
  update(enemies, infoTracker) {
    if (!enemies || enemies.length === 0) return;

    if (this.cooldown > 0) {
      this.cooldown--;
      return;
    }

    // Find closest alive enemy in range
    let target = null;
    let closestDist = Infinity;

    for (let enemy of enemies) {
      if (!enemy || !enemy.alive) continue;
      const d = dist(this.x, this.y, enemy.x, enemy.y);
      if (d <= this.range && d < closestDist) {
        closestDist = d;
        target = enemy;
      }
    }

    // Fire
    if (target) {
      target.takeDamage(this.damage, infoTracker);
      this.cooldown = Math.ceil(this.rate * 60); // seconds → frames
    }
  }

  draw() {
    // body
    fill(100, 100, 255);
    circle(this.x, this.y, 30);

    // range ring
    noFill();
    stroke(0, 0, 255, 50);
    circle(this.x, this.y, this.range * 2);
  }

  // Semi-transparent “ghost” while dragging
  drawGhost() {
    push();
    noFill();
    stroke(0, 0, 255, 60);
    circle(this.x, this.y, this.range * 2);
    noStroke();
    fill(100, 100, 255, 160);
    circle(this.x, this.y, 30);
    pop();
  }
}
