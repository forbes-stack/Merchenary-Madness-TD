class SniperTower extends Tower {
  constructor(x, y) {
    super(x, y, 60, 75, 3, "sniper");
    this._shotDuration = 20;
    this.maxLevel = 3;
    this.shotSound = 'sniper';
    this.radius = 16; // footprint: placement spacing + click area
  }

  // Green, thin beam
  _beamStyle() {
    return {
      strokeWeight: 1.5,
      stroke: [200, 0, 0, 220],
      impact: [255, 0, 0, 200],
      impactSize: 10
    };
  }

  draw() {
    this._drawShotTracer();

    push();
    imageMode(CENTER);

    if (!this.target) {
      this._sprite(sniperTowerImg, this.x, this.y, 60, 80, 110, 0, 140, 0);
    } else {
      let dx = this.target.x - this.x;
      let dy = this.target.y - this.y;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0)
          this._sprite(sniperTowerImg, this.x, this.y, 80, 80, 225, 0, 175, 0); // right
        else
          this._sprite(sniperTowerImg, this.x, this.y, 110, 80, 380, 0, 225, 0); // left
      } else {
        if (dy < 0)
          this._sprite(sniperTowerImg, this.x, this.y, 60, 80, 0, 0, 125, 0); // back
        else
          this._sprite(sniperTowerImg, this.x, this.y, 60, 80, 110, 0, 140, 0); // front
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
    stroke(150, 0, 0, 60);
    strokeWeight(1);
    circle(this.x, this.y, this.range * 2);
    noStroke();
    fill(0, 150, 0, 160);
    circle(this.x, this.y, 30);
    pop();
  }

  // Unlimited reach, but enemies must NOT be inside the minimum range
  inRange(d) {
    return d >= this.range;
  }
}
