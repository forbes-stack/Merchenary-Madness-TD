// effects.js
// Short-lived visual feedback: dust puffs when a tower lands, floating cost text,
// and a gold sparkle on upgrades. Call effects.update() once per game step and
// effects.draw() once per frame.

class Effects {
  constructor() {
    this.items = [];
  }

  /** Dust cloud bursting out from under a tower that was just placed. */
  dust(x, y) {
    for (let i = 0; i < 10; i++) {
      const angle = (TWO_PI * i) / 10 + random(-0.2, 0.2);
      const speed = random(0.6, 1.4);
      this.items.push({
        kind: "dust", x: x, y: y + 18,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed * 0.4,
        size: random(8, 14), life: 30, maxLife: 30,
      });
    }
  }

  /** Text that floats up and fades, e.g. "-$50" or "+$25". */
  floatText(x, y, label, col) {
    this.items.push({ kind: "text", x, y: y - 30, label, col, life: 50, maxLife: 50 });
  }

  /** Gold stars bursting around an upgraded tower. */
  sparkle(x, y) {
    for (let i = 0; i < 12; i++) {
      const angle = (TWO_PI * i) / 12;
      const speed = random(1.2, 2.2);
      this.items.push({
        kind: "spark", x, y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        size: random(4, 7), life: 30, maxLife: 30,
      });
    }
  }

  update() {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const e = this.items[i];
      if (e.kind === "text") {
        e.y -= 0.6;
      } else {
        e.x += e.vx;
        e.y += e.vy;
        e.vx *= 0.92;
        e.vy *= 0.92;
        if (e.kind === "dust") e.size += 0.3;
      }
      e.life--;
      if (e.life <= 0) this.items.splice(i, 1);
    }
  }

  draw() {
    for (const e of this.items) {
      const a = 255 * (e.life / e.maxLife);
      push();
      if (e.kind === "dust") {
        noStroke();
        fill(196, 160, 110, a * 0.7);
        circle(e.x, e.y, e.size);
      } else if (e.kind === "spark") {
        stroke(255, 215, 0, a);
        strokeWeight(2);
        line(e.x - e.size / 2, e.y, e.x + e.size / 2, e.y);
        line(e.x, e.y - e.size / 2, e.x, e.y + e.size / 2);
      } else {
        textAlign(CENTER, CENTER);
        textSize(20);
        textStyle(BOLD);
        stroke(0, a);
        strokeWeight(3);
        fill(...e.col, a);
        text(e.label, e.x, e.y);
      }
      pop();
    }
  }

  clear() {
    this.items = [];
  }
}

const effects = new Effects();
