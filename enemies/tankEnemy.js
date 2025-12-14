class tankEnemy extends Enemy {
  constructor(path) {
    super(path, 0.5, 500, 5);
    this.direction = "down"; // default starting direction
    this.frame = 0;          // frame cycle for walking animation
  }

  updateDirection(target) {
    let dx = target.x - this.x;
    let dy = target.y - this.y;

    // Determine direction (simple beginner style)
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

    // Cycle frames for walking
    this.frame = frameCount % 60;
  }

  drawBody() {
    push();
    imageMode(CENTER); // only affects this enemy

    let x = this.x;
    let y = this.y;


    // Walking backward (up)
    if (this.direction == "up") {
      if (this.frame < 30) {
        image(tankEnemyImg, x, y, 50, 125, 0, 170, 125, 0);
      } else {
        image(tankEnemyImg, x, y, 30, 125, 125, 170, 75, 0); // far one
      }
    }

    // Walking forward (down)
   if (this.direction == "down") {
        if (this.frame < 30) {
            image(tankEnemyImg, x, y, 50, 50, 335, 0, 125, 170);
        } else {
            image(tankEnemyImg, x, y, 50, 50, 225, 0, 110, 170);
        }
    }

    // Facing left
    if (this.direction == "left") {
      image(tankEnemyImg, x, y, 50, 50, 0, 0, 125, 170);
    }

    // Facing right
    if (this.direction == "right") {
      image(tankEnemyImg, x, y, 50, 50, 133, 0, 125, 170);
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
