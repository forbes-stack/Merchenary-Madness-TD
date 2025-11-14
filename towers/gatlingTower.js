class GatlingGunTower extends Tower {
  constructor(x, y) {
    // x, y, range, damage, rate
    // Increased damage from 2 to 3
    super(x, y, 100, 3, 0.1); // Fast rate, low damage
  }

  draw() {
    // body
    push();
    fill(0, 150, 0); // Green
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
    noStroke();
    fill(0, 150, 0, 160); // Translucent Green
    circle(this.x, this.y, 30);
    pop();
  }
}
