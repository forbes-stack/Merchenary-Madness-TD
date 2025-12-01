// Tower.js
class Tower {
  constructor(x, y, range, damage, rate, towerType) {
    this.x = x;
    this.y = y;
    this.range = range;
    this.damage = damage;
    this.rate = rate;
    this.cooldown = 0;

    this.towerType = towerType || 'basic'; // The type string (e.g., 'gatling', 'cannon')
    this.level = 1;
    this.maxLevel = 3; // Default max level. Subclasses will override.
    this.upgradePath = null; // 'damage', 'rate', or null (for pre-choice)

    // tracer fields
    this._shotTimer = 0;
    this._shotDuration = 8;     // default beam lifetime (frames)
    this._lastTargetRef = null;
  }

  // Override for custom beam styling per subclass
  _beamStyle() {
    return {
      strokeWeight: 2,
      stroke: [255, 255, 0, 200], // yellow
      impact: [255, 255, 0, 200],
      impactSize: 6
    };
  }

  // Reusable tracer (call this at the start of draw() in subclasses)
  _drawShotTracer() {
    if (this._shotTimer > 0 && this._lastTargetRef && this._lastTargetRef.alive) {
      const s = this._beamStyle();
      const trg = this._lastTargetRef;
      push();
      stroke(...s.stroke);
      strokeWeight(s.strokeWeight);
      line(this.x, this.y, trg.x, trg.y);
      noStroke();
      fill(...s.impact);
      circle(trg.x, trg.y, s.impactSize);
      pop();
    }
    if (this._shotTimer > 0) {
      this._shotTimer--;
      if (this._shotTimer <= 0) this._lastTargetRef = null;
    }
  }

  update(enemies, infoTracker) {
    if (!enemies || enemies.length === 0) return;
    if (this.cooldown > 0) { this.cooldown--; return; }

    // closest-in-range (current behavior)
    let target = null, closestDist = Infinity;
    for (let enemy of enemies) {
      if (!enemy || !enemy.alive) continue;
      const d = dist(this.x, this.y, enemy.x, enemy.y);
      if (d <= this.range && d < closestDist) { closestDist = d; target = enemy; }
    }

    if (target) {
      target.takeDamage(this.damage, infoTracker);
      this.cooldown = Math.ceil(this.rate * 60);

      // start tracer
      this._lastTargetRef = target;
      this._shotTimer = this._shotDuration;
    }
  }

  draw() {
    // draw tracer first
    this._drawShotTracer();

    // body
    fill(100, 100, 255);
    circle(this.x, this.y, 30);

    // range
    noFill();
    stroke(0, 0, 255, 50);
    circle(this.x, this.y, this.range * 2);
  }

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

  // Draws a white ring and the range when selected
  drawSelection() {
    push();
    noFill();
    stroke(255);
    strokeWeight(2);
    circle(this.x, this.y, 35); // Selection ring

    stroke(255, 255, 255, 100);
    strokeWeight(1);
    circle(this.x, this.y, this.range * 2); // Range ring
    pop();
  }

  isMaxLevel() {
    return this.level >= 3;
  }
}
