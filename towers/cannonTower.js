class CannonTower extends Tower {
  constructor(x, y) {
    // x, y, range, damage, rate
    super(x, y, 150, 50, 2.0); // Slow rate, high damage
  }

  draw() {
    // body
    push();
    fill(0, 0, 200); // Blue
    noStroke();
    // Draw a triangle
    let r = 18; // radius
    triangle(
      this.x, this.y - r, // top point
      this.x - r, this.y + r * 0.5, // bottom left
      this.x + r, this.y + r * 0.5  // bottom right
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
    // range ring
    noFill();
    stroke(0, 0, 200, 60);
    strokeWeight(1);
    circle(this.x, this.y, this.range * 2);

    // body
    noStroke();
    fill(0, 0, 200, 160); // Translucent Blue
    let r = 18;
    triangle(
      this.x, this.y - r,
      this.x - r, this.y + r * 0.5,
      this.x + r, this.y + r * 0.5
    );
    pop();
  }
}
