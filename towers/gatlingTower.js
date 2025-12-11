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
    this._drawShotTracer();

    push();
    imageMode(CENTER);

    if (!this.target) {
      image(gatlingTowerImg, this.x, this.y, 50, 80, 0, 0, 100, 0);
    } else {
      let dx = this.target.x - this.x;
      let dy = this.target.y - this.y;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0)
          image(gatlingTowerImg, this.x, this.y, 80, 70, 200, 0, 200, 0); // right
        else
          image(gatlingTowerImg, this.x, this.y, 80, 70, 400, 0, 225, 0); // left
      } else {
        if (dy < 0)
          image(gatlingTowerImg, this.x, this.y, 80, 70, 100, 0, 100, 0); // back
        else
          image(gatlingTowerImg, this.x, this.y, 50, 80, 0, 0, 100, 0); // front
          
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
}
