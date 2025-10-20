
// General enemy object
class Enemy {
  constructor(x, y, spd, size, pathFn, health) {
    this.x = x;
    this.y = y;
    this.spd = spd;
    this.size = size;
    this.hth = 100;
    this.time = x;
    this.pathFn = pathFn;
  }

  update() {
    this.time += this.spd;
    let pos = this.pathFn(this.time);
    this.x = pos.x;
    this.y = pos.y;
  }

  draw() {
    circle(this.x, this.y, this.size);
    this.healthbar();
  }

  healthbar() {
    push();
    stroke(255, 0, 0);
    strokeWeight(3);
    line(this.x - 35, this.y + 70, this.x + 35, this.y + 70);
    pop();
  }
}
