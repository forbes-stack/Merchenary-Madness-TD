class GatlingGunTower extends Tower {
  constructor(x, y) {
    // Pass 'gatling' as the towerType
    super(x, y, 100, 3, 0.1, 'gatling'); // <--- Updated super call
    this._shotDuration = 5;   // shorter beam so it doesn't look like a solid line
    this.maxLevel = 3; // Max level for Gatling is 3
  }

  // Green, thin beam
  _beamStyle() {
    return {
      strokeWeight: 1.5,
      stroke: [0, 200, 0, 220],
      impact: [0, 255, 0, 200],
      impactSize: 5
    };
  }

  draw() {
    // draw tracer first
    this._drawShotTracer();

    // body
    push();
    fill(0, 150, 0);
    noStroke();
    circle(this.x, this.y, 30);

    // range ring
    noFill();
    stroke(0, 150, 0, 50);
    strokeWeight(1);
    circle(this.x, this.y, this.range * 2);
    pop();
  }

  drawGhost() {
    push();
    noFill();
    stroke(0, 150, 0, 60);
    strokeWeight(1);
    circle(this.x, this.y, this.range * 2);
    pop();
  }
}
