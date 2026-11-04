// Tower.js

class Tower {
  // Targeting modes the player can cycle through in the tower menu
  static TARGET_MODES = ["First", "Near", "Far", "Strong", "Weak"];

  constructor(x, y, range, damage, rate, towerType) {
    this.x = x;
    this.y = y;
    this.range = range;
    this.damage = damage;
    this.rate = rate;
    this.cooldown = 0;
    this.radius = 14; // footprint: placement spacing + click area (subclasses override)
    this.targetMode = "First";

    this.towerType = towerType || 'basic'; // The type string (e.g., 'gatling', 'cannon')
    this.shotSound = 'revolver'; // sfx name played when firing (subclasses override)
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

  // 🔹 NEW: generic damage hook — default is single-target
  applyDamage(mainTarget, allEnemies, infoTracker) {
    if (!mainTarget || !mainTarget.alive) return;
    if (typeof mainTarget.takeDamage === "function") {
      mainTarget.takeDamage(this.damage, infoTracker);
    }
  }

  // Switch to the next targeting mode (wraps around)
  cycleTargetMode() {
    const modes = Tower.TARGET_MODES;
    const i = modes.indexOf(this.targetMode);
    this.targetMode = modes[(i + 1) % modes.length];
  }

  // Whether an enemy at distance d can be shot (Sniper overrides this)
  inRange(d) {
    return d <= this.range;
  }

  // Progress along path (waypoint index + fraction along segment), or null if off the path
  _pathProgress(enemy) {
    const idx = enemy.pathIndex - 1; // previous waypoint
    if (idx < 0 || idx >= enemy.path.length - 1) return null;

    const prev = enemy.path[idx];
    const next = enemy.path[idx + 1];

    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const segmentLength = Math.hypot(dx, dy);
    if (segmentLength === 0) return null;

    const dxEnemy = enemy.x - prev.x;
    const dyEnemy = enemy.y - prev.y;
    const segmentProgress = Math.hypot(dxEnemy, dyEnemy) / segmentLength;

    return idx + segmentProgress;
  }

  /**
   * Pick the enemy to shoot according to this.targetMode:
   * First = furthest along the path, Near/Far = closest/farthest from the tower,
   * Strong/Weak = most/least current health.
   */
  _chooseTarget(enemies) {
    let target = null;
    let bestScore = -Infinity;

    for (let enemy of enemies) {
      if (!enemy || !enemy.alive) continue;
      if (enemy.camo && !this.detectsCamo) continue; // can't see camo without a spotter

      const d = dist(this.x, this.y, enemy.x, enemy.y);
      if (!this.inRange(d)) continue; // skip out-of-range enemies

      let score;
      if (this.targetMode === "Near") score = -d;
      else if (this.targetMode === "Far") score = d;
      else if (this.targetMode === "Strong") score = enemy.health;
      else if (this.targetMode === "Weak") score = -enemy.health;
      else {
        score = this._pathProgress(enemy); // "First"
        if (score === null) continue;
      }

      if (score > bestScore) {
        bestScore = score;
        target = enemy;
      }
    }

    return target;
  }

  update(enemies, infoTracker) {
    if (!enemies || enemies.length === 0) return;
    if (this.cooldown > 0) { this.cooldown--; return; }

    const target = this._chooseTarget(enemies);

    if (target) {
      // 🔹 CHANGED: use applyDamage instead of direct takeDamage
      this.applyDamage(target, enemies, infoTracker);
      sfx.play(this.shotSound);

      this.cooldown = Math.ceil(this.rate * 60);

      // store snapshot position so tracer works even if the enemy dies
      this._lastShotX = target.x;
      this._lastShotY = target.y;
      this._shotTimer = this._shotDuration;

      this.target = target
    } else {
      this.target = null;
    }
  }

  draw() {
    // draw tracer first
    this._drawShotTracer();

  push();
  imageMode(CENTER);

 if (!this.target) {
  // front
  this._sprite(cowboyTower, this.x, this.y, 40, 60, 200, 0, 100, 0);
} else {
  let dx = this.target.x - this.x;
  let dy = this.target.y - this.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0)
      this._sprite(cowboyTower, this.x, this.y, 80, 60, 450, 0, 225, 0); // right
    else
      this._sprite(cowboyTower, this.x, this.y, 60, 60, 300, 0, 125, 0); // left
  } else {
    if (dy < 0)
      this._sprite(cowboyTower, this.x, this.y, 60, 60, 20, 0, 150, 0);  // back
    else
      this._sprite(cowboyTower, this.x, this.y, 40, 60, 200, 0, 100, 0); // front
  }
}

  pop();
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
  // Draws the range ring when selected (the tower sprite itself is drawn by draw())
  drawSelection() {
    push();
    noFill();
    stroke(255, 255, 255, 100);
    strokeWeight(1);
    circle(this.x, this.y, this.range * 2); // Range ring
    pop();
  }

  // ---------- upgrade glow ----------
  // A glow that hugs the sprite's outline. Blurring live every frame (canvas shadowBlur)
  // slows all later drawing badly, so each sprite frame gets a pre-blurred glow image
  // per color, made once, and drawn right behind the sprite.

  static GLOW_PAD = 24;           // glow reach around the figure, in sheet pixels
  static glowFrames = new Map();  // sheet -> { "r,g,b|sx,sy,sw,sh": p5.Graphics }

  static glowFrame(sheet, col, sx, sy, srcW, srcH) {
    let cache = Tower.glowFrames.get(sheet);
    if (!cache) {
      cache = {};
      Tower.glowFrames.set(sheet, cache);
    }
    const key = `${col.join(",")}|${sx},${sy},${srcW},${srcH}`;
    if (!cache[key]) {
      const P = Tower.GLOW_PAD;
      const g = createGraphics(srcW + 2 * P, srcH + 2 * P);
      g.pixelDensity(1);
      const ctx = g.drawingContext;
      // only the part of the frame that lies on the sheet (some crops run past its edge)
      const cw = Math.min(srcW, sheet.width - sx);
      const ch = Math.min(srcH, sheet.height - sy);
      // Draw the frame far off to the side so only its blurred shadow lands on the
      // graphics; stacking a few passes makes the glow strong enough to read.
      const away = 10000;
      ctx.shadowColor = `rgb(${col.join(",")})`;
      ctx.shadowBlur = 14;
      ctx.shadowOffsetX = away;
      for (let pass = 0; pass < 3; pass++) {
        ctx.drawImage(sheet.canvas, sx, sy, cw, ch, P - away, P, cw, ch);
      }
      cache[key] = g;
    }
    return cache[key];
  }

  /**
   * Draws one frame of a sprite sheet, exactly like p5's image(sheet, x, y, w, h, sx, sy, sw, sh)
   * (imageMode CENTER), plus the upgrade glow behind it when this.glow is set
   * ({ color: [r, g, b], alpha: 0..1 }, set by UI.drawTowerWithAura).
   */
  _sprite(sheet, x, y, w, h, sx, sy, sw, sh) {
    if (this.glow) {
      // p5 treats a source width/height of 0 as the full sheet size
      const srcW = sw || sheet.width;
      const srcH = sh || sheet.height;
      const P = Tower.GLOW_PAD;
      const glow = Tower.glowFrame(sheet, this.glow.color, sx, sy, srcW, srcH);
      const ctx = drawingContext;
      const prevAlpha = ctx.globalAlpha;
      ctx.globalAlpha = this.glow.alpha;
      // same center as the sprite, grown by the padding on every side
      image(glow, x, y, w * (srcW + 2 * P) / srcW, h * (srcH + 2 * P) / srcH);
      ctx.globalAlpha = prevAlpha;
    }
    image(sheet, x, y, w, h, sx, sy, sw, sh);
  }

  isMaxLevel() {
    return this.level >= 3;
  }
}
