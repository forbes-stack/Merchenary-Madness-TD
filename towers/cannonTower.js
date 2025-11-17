class CannonTower extends Tower {
  constructor(x, y) {
    super(x, y, 150, 50, 2.0); // slow, high damage
    this._shotDuration = 12;   // lingers longer to emphasize the big hit
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
    // draw tracer first
    this._drawShotTracer();

    // body (triangle)
    push();
    fill(0, 0, 200);
    noStroke();
    const r = 18;
    triangle(
      this.x, this.y - r,
      this.x - r, this.y + r * 0.5,
      this.x + r, this.y + r * 0.5
    );

    // range ring
    noFill();
    stroke(0, 0, 200, 50);
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
    noStroke();
    fill(0, 0, 200, 160);
    const r = 18;
    triangle(
      this.x, this.y - r,
      this.x - r, this.y + r * 0.5,
      this.x + r, this.y + r * 0.5
    );
    pop();
  }
}
