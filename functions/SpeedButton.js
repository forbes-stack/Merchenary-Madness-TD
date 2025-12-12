class SpeedButton {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.isFast = false; // false = 1x, true = 2x
  }

  handleClick(mx, my) {
    const clicked =
      mx >= this.x && mx <= this.x + this.w &&
      my >= this.y && my <= this.y + this.h;

    if (clicked) {
      this.isFast = !this.isFast;
      gameSpeed = this.isFast ? 2 : 1;
    }

    return clicked;
  }

  display() {
    push();

    // background
    stroke(0);
    strokeWeight(2);
    if (this.isFast) {
      fill(180, 240, 180);   // "on"
    } else {
      fill(240);             // "off"
    }
    rect(this.x, this.y, this.w, this.h, 8);

    // label
    noStroke();
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(16);
    text(this.isFast ? "2x" : "1x", this.x + this.w / 2, this.y + this.h / 2);

    pop();
  }

  draw() {
    this.display();
  }
}
