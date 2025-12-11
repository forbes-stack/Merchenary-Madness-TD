class CannonTower extends Tower {
  constructor(x, y) {
    // Pass 'cannon' as the towerType
    super(x, y, 150, 50, 2.0, 'cannon'); // range, damage, rate, type
    this._shotDuration = 12;   // lingers longer to emphasize the big hit
    this.maxLevel = 4;         // Max level for Cannon is 4

    // Splash properties
    this.splashRadius = 60;    // visual + damage radius
    this._splashDuration = 12; // how many frames the AoE circle is visible
    this._splashTimer = 0;
    this._splashX = 0;
    this._splashY = 0;
  }

  // Splash damage: full to mainTarget, half to nearby enemies
  applyDamage(mainTarget, allEnemies, infoTracker) {
    if (!mainTarget || !mainTarget.alive) return;

    // Fallback: if enemies array is missing, just do single-target
    if (!allEnemies || !Array.isArray(allEnemies)) {
      if (typeof mainTarget.takeDamage === "function") {
        mainTarget.takeDamage(this.damage, infoTracker);
      }
      return;
    }

    // --- Full damage to main target ---
    if (typeof mainTarget.takeDamage === "function") {
      mainTarget.takeDamage(this.damage, infoTracker);
    }

    // --- Splash to nearby enemies (half damage) ---
    const splashDamage = Math.floor(this.damage / 2);

    for (let enemy of allEnemies) {
      if (!enemy || !enemy.alive) continue;
      if (enemy === mainTarget) continue;

      // Distance from impact
      const d = dist(mainTarget.x, mainTarget.y, enemy.x, enemy.y);
      if (d <= this.splashRadius) {
        if (typeof enemy.takeDamage === "function") {
          enemy.takeDamage(splashDamage, infoTracker);
        }
      }
    }

    // Store splash position for visual AoE circle
    this._splashX = mainTarget.x;
    this._splashY = mainTarget.y;
    this._splashTimer = this._splashDuration;
  }

  // Blue, heavier beam
  _beamStyle() {
    return {
      strokeWeight: 3,
      stroke: [50, 140, 255, 220],
      impact: [50, 140, 255, 220],
      impactSize: 7
    };
  }
draw() {
  this._drawShotTracer();

  push();
  imageMode(CENTER);

  if (!this.target) {
    image(cannonTowerImg, this.x, this.y, 50, 70, 0, 0, 100, 0);
  } else {
    let dx = this.target.x - this.x;
    let dy = this.target.y - this.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0)
        image(cannonTowerImg, this.x, this.y, 80, 80, 200, 0, 200, 0); // right
      else
        image(cannonTowerImg, this.x, this.y, 80, 80, 410, 0, 225, 0); // left
    } else {
      if (dy < 0)
        image(cannonTowerImg, this.x, this.y, 50, 60, 100, 0, 110, 0);  // back
      else
        image(cannonTowerImg, this.x, this.y, 50, 70, 0, 0, 100, 0); // front
    }
  }
    pop();
  }

  drawSelection() {
    push();
    noFill();
    stroke(255);
    strokeWeight(1);
    circle(this.x, this.y, this.range * 2);
    pop();
  }

  drawGhost() {
    push();
    noFill();
    stroke(0, 0, 200, 60);
    strokeWeight(1);
    circle(this.x, this.y, this.range * 2);
    pop();
  }
}
