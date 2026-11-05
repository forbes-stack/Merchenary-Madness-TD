// titleAmbience.js
// Title-screen ambience: wind streaks and drifting dust blowing across the desert,
// and now and then a tumbleweed rolling and bouncing along the dunes.
//
// Drawn on its own full-window canvas layered over the page (it can't be clicked, so
// buttons work as usual), so it crosses the drawing and its extended edges alike.
// Positions are in title-canvas coordinates (700x650 drawing, see canvasLayout) and
// converted to the screen, so it lines up with the dunes at any window size.
// Off when the player's system asks for reduced motion.

const titleAmbience = {
  cnv: null,
  ctx: null,
  running: false,
  lastTime: 0,
  streaks: [],
  dust: [],
  weeds: [],
  nextWeedIn: 3,       // seconds until the next tumbleweed
  weedImage: null,

  start() {
    sfx.startWind(); // the wind sound plays even when motion is reduced (it's not motion)
    if (this.running) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!this.cnv) this._createCanvas();
    this.cnv.style.display = "block";
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this._frame(t));
  },

  stop() {
    sfx.stopWind();
    this.running = false;
    if (this.cnv) this.cnv.style.display = "none";
    this.weeds = [];
    this.nextWeedIn = 3;
  },

  // ---------- setup ----------

  _createCanvas() {
    this.cnv = document.createElement("canvas");
    Object.assign(this.cnv.style, {
      position: "fixed", left: "0", top: "0", width: "100%", height: "100%",
      pointerEvents: "none", zIndex: "5",
    });
    document.body.appendChild(this.cnv);
    this.ctx = this.cnv.getContext("2d");
    this.weedImage = this._drawTumbleweed();
  },

  // Hand-drawn style tumbleweed: a ball of tangled brown loops, drawn once and rotated
  _drawTumbleweed() {
    const size = 128, c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d");
    g.translate(size / 2, size / 2);
    g.lineCap = "round";
    const loops = [[107, 65, 0, 5], [74, 45, 0, 4], [140, 95, 40, 3], [160, 120, 60, 2.5]];
    for (const [r, gr, b, w] of loops) {
      g.strokeStyle = `rgb(${r}, ${gr}, ${b})`;
      g.lineWidth = w;
      for (let i = 0; i < 9; i++) {
        g.beginPath();
        const rad = 22 + Math.random() * 34;
        g.ellipse((Math.random() - 0.5) * 22, (Math.random() - 0.5) * 22,
          rad, rad * (0.4 + Math.random() * 0.6), Math.random() * Math.PI,
          Math.random() * Math.PI, Math.random() * Math.PI + Math.PI * 1.2);
        g.stroke();
      }
    }
    return c;
  },

  // title-canvas coordinates -> screen pixels
  _toScreen(x, y) {
    const s = canvasLayout.scale;
    return {
      x: window.innerWidth / 2 + (x - 350) * s,
      y: window.innerHeight / 2 + (y - 325) * s,
    };
  },

  // the visible window, in title-canvas coordinates
  _view() {
    const s = canvasLayout.scale;
    return {
      left: 350 - window.innerWidth / 2 / s, right: 350 + window.innerWidth / 2 / s,
      top: 325 - window.innerHeight / 2 / s, bottom: 325 + window.innerHeight / 2 / s,
    };
  },

  // ---------- animation ----------

  _frame(now) {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.lastTime) / 1000); // seconds; capped after tab switches
    this.lastTime = now;

    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(window.innerWidth * dpr), h = Math.round(window.innerHeight * dpr);
    if (this.cnv.width !== w || this.cnv.height !== h) { this.cnv.width = w; this.cnv.height = h; }
    const ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    this._updateWind(dt);
    this._updateWeeds(dt);
    this._drawWind(ctx);
    this._drawWeeds(ctx);

    requestAnimationFrame((t) => this._frame(t));
  },

  _updateWind(dt) {
    const v = this._view();
    // wind streaks: thin gusts sweeping left to right, mostly through the sky
    while (this.streaks.length < 9) {
      this.streaks.push({
        x: v.left - 200 - Math.random() * (v.right - v.left),
        y: v.top + Math.random() * (440 - v.top),
        len: 70 + Math.random() * 120,
        speed: 260 + Math.random() * 200,
        wave: Math.random() * Math.PI * 2,
        alpha: 0.18 + Math.random() * 0.22,
      });
    }
    for (const st of this.streaks) { st.x += st.speed * dt; st.wave += dt * 3; }
    this.streaks = this.streaks.filter(st => st.x - st.len < v.right + 50);

    // dust: sand-colored specks skimming over the dunes
    while (this.dust.length < 40) {
      this.dust.push({
        x: v.left - Math.random() * 300,
        y: 420 + Math.random() * Math.min(240, v.bottom - 420),
        speed: 120 + Math.random() * 160,
        size: 1 + Math.random() * 2.2,
        bob: Math.random() * Math.PI * 2,
      });
    }
    for (const d of this.dust) { d.x += d.speed * dt; d.bob += dt * 4; }
    this.dust = this.dust.filter(d => d.x < v.right + 20);
  },

  _updateWeeds(dt) {
    const v = this._view();
    this.nextWeedIn -= dt;
    if (this.nextWeedIn <= 0 && this.weeds.length === 0) {
      const size = 50 + Math.random() * 22;
      this.weeds.push({
        x: v.left - size,
        ground: 560 + Math.random() * 40,  // rolls along the dunes, below the buttons
        size,
        speed: 150 + Math.random() * 70,
        angle: 0,
        hop: 0, hopVel: 0,                 // bounce height and vertical speed
      });
      this.nextWeedIn = 8 + Math.random() * 9; // next one in 8-17 seconds
      sfx.play("gust"); // the wind that blows it in
    }
    for (const wd of this.weeds) {
      wd.x += wd.speed * dt;
      wd.angle += (wd.speed * dt) / (wd.size / 2); // rolls without slipping
      // bounce: gravity pulls it down; it pops back up off the bumps
      wd.hopVel -= 900 * dt;
      wd.hop += wd.hopVel * dt;
      if (wd.hop <= 0) { wd.hop = 0; wd.hopVel = 120 + Math.random() * 220; }
    }
    this.weeds = this.weeds.filter(wd => wd.x - wd.size < v.right);
  },

  _drawWind(ctx) {
    const s = canvasLayout.scale;
    ctx.lineCap = "round";
    for (const st of this.streaks) {
      const a = this._toScreen(st.x - st.len, st.y);
      const b = this._toScreen(st.x, st.y);
      const sway = Math.sin(st.wave) * 6 * s;
      const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      grad.addColorStop(0, "rgba(255, 255, 255, 0)");
      grad.addColorStop(0.6, `rgba(255, 255, 255, ${st.alpha})`);
      grad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = Math.max(1, 2.2 * s);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo((a.x + b.x) / 2, a.y - sway, b.x, b.y + sway * 0.4);
      ctx.stroke();
    }
    for (const d of this.dust) {
      const p = this._toScreen(d.x, d.y + Math.sin(d.bob) * 3);
      ctx.fillStyle = "rgba(225, 205, 150, 0.55)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, d.size * s, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  _drawWeeds(ctx) {
    const s = canvasLayout.scale;
    for (const wd of this.weeds) {
      const base = this._toScreen(wd.x, wd.ground);
      const r = (wd.size / 2) * s;
      // shadow on the sand, smaller and fainter while it's in the air
      const lift = Math.min(1, wd.hop / 60);
      ctx.fillStyle = `rgba(90, 70, 40, ${0.28 * (1 - lift * 0.6)})`;
      ctx.beginPath();
      ctx.ellipse(base.x, base.y, r * (1 - lift * 0.3), r * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
      // the tumbleweed itself
      ctx.save();
      ctx.translate(base.x, base.y - r - wd.hop * s);
      ctx.rotate(wd.angle);
      ctx.drawImage(this.weedImage, -r * 1.1, -r * 1.1, r * 2.2, r * 2.2);
      ctx.restore();
    }
  },
};
