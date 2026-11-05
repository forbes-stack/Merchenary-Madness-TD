class SpeedButton {
  // Each click moves to the next speed: 1x -> 2x -> 3x -> back to 1x
  static SPEEDS = [1, 2, 3];

  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.index = 0; // position in SPEEDS (0 = 1x)
  }

  get speed() {
    return SpeedButton.SPEEDS[this.index];
  }

  handleClick(mx, my) {
    const clicked =
      mx >= this.x && mx <= this.x + this.w &&
      my >= this.y && my <= this.y + this.h;

    if (clicked) {
      this.index = (this.index + 1) % SpeedButton.SPEEDS.length;
      gameSpeed = this.speed;
    }

    return clicked;
  }

  // Back to 1x (used by Restart)
  reset() {
    this.index = 0;
    gameSpeed = this.speed;
  }

  display() {
    push();

    // background: plain at 1x, greener the faster it goes
    stroke(0);
    strokeWeight(2);
    if (this.speed === 3) {
      fill(120, 220, 120);
    } else if (this.speed === 2) {
      fill(180, 240, 180);
    } else {
      fill(240);
    }
    rect(this.x, this.y, this.w, this.h, 16);

    // label
    noStroke();
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(32);
    text(`${this.speed}x`, this.x + this.w / 2, this.y + this.h / 2);

    pop();
  }

  draw() {
    this.display();
  }
}
