class fastEnemy extends Enemy {
  constructor(path) {
    super(path, 3, 25, 1);
    this.direction = "down"; // default starting direction
    this.frame = 0;          // frame cycle for walking animation
  }

  updateDirection(target) {
    let dx = target.x - this.x;
    let dy = target.y - this.y;

    // Determine direction (no ternary operators, beginner style)
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) {
        this.direction = "right";
      } else {
        this.direction = "left";
      }
    } else {
      if (dy > 0) {
        this.direction = "down"; // forward
      } else {
        this.direction = "up";   // backward
      }
    }

    // Cycle frames
    this.frame = frameCount % 60;
  }

  drawBody() {
    push();
    imageMode(CENTER); // only affects this enemy drawing

    let x = this.x;
    let y = this.y;

    if (this.direction == "up") {
      if (this.frame < 30) {
        image(fastEnemyImg, x, y, 50, 100, 0, 170, 100, 0);
      } else {
        image(fastEnemyImg, x, y, 50, 100, 100, 170, 100, 0);
      }
    }


    // Walking forward (down)
    if (this.direction == "down") {
      if (this.frame < 30) {
        image(fastEnemyImg, x, y, 50, 125, 300, 170, 100, 0);
      } else {
        image(fastEnemyImg, x, y, 50, 125, 200, 170, 100, 0);
      }
    }

    // Walking right
    if (this.direction == "right") {
      if (this.frame < 30) {
        image(fastEnemyImg, x, y, 35, 50, 120, 0, 75, 170);
      } else {
        image(fastEnemyImg, x, y, 50, 50, 0, 0, 100, 170);
      }
    }

    // Walking left
    if (this.direction == "left") {
      if (this.frame < 30) {
        image(fastEnemyImg, x, y, 40, 50, 230, 0, 85, 170);
      } else {
        image(fastEnemyImg, x, y, 50, 50, 325, 0, 100, 170);
      }
    }

    pop();
  }

  draw() {
    super.draw(); // draws body + health bar
  }

  update(infoTracker) {
    if (!this.alive) return;

    if (this.pathIndex < this.path.length) {
      let target = this.path[this.pathIndex];
      this.updateDirection(target);
      this.move(target);
    } else {
      infoTracker.loseHealth(10);
      this.alive = false;
    }
  }
}
