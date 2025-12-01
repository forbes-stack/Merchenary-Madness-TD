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
    this.level = 0;
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
    if (this._shotTimer > 0) {
    const style = this._beamStyle();

    push();
    strokeWeight(style.strokeWeight);
    stroke(...style.stroke);

    line(this.x, this.y, this._lastShotX, this._lastShotY);

    // impact flash
    fill(...style.impact);
    noStroke();
    circle(this._lastShotX, this._lastShotY, style.impactSize);

    pop();

    this._shotTimer--;
  }
  }

  update(enemies, infoTracker) {
if (!enemies || enemies.length === 0) return;
if (this.cooldown > 0) { this.cooldown--; return; }

let target = null;
let maxProgress = -Infinity;

for (let enemy of enemies) {
  if (!enemy || !enemy.alive) continue;

  const d = dist(this.x, this.y, enemy.x, enemy.y);
  if (d > this.range) continue; // skip out-of-range enemies

  // Compute progress along path (index + fraction along segment)
  const idx = enemy.pathIndex - 1; // previous waypoint
  if (idx < 0 || idx >= enemy.path.length - 1) continue;

  const prev = enemy.path[idx];
  const next = enemy.path[idx + 1];

  const dx = next.x - prev.x;
  const dy = next.y - prev.y;
  const segmentLength = Math.hypot(dx, dy);
  if (segmentLength === 0) continue;

  const dxEnemy = enemy.x - prev.x;
  const dyEnemy = enemy.y - prev.y;
  const segmentProgress = Math.hypot(dxEnemy, dyEnemy) / segmentLength;

  const progress = idx + segmentProgress;

  if (progress > maxProgress) {
    maxProgress = progress;
    target = enemy;
  }
}

if (target) {
  target.takeDamage(this.damage, infoTracker);
  this.cooldown = Math.ceil(this.rate * 60);

// store snapshot position so tracer works even if the enemy dies
this._lastShotX = target.x;
this._lastShotY = target.y;
this._shotTimer = this._shotDuration;
}
  }

  draw() {
    // draw tracer first
    this._drawShotTracer();

    // body
    fill(100, 100, 255);
    circle(this.x, this.y, 30);

    // // range
    noFill();
    // stroke(0, 0, 255, 50);
    // circle(this.x, this.y, this.range * 2);
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
