class basicEnemy extends Enemy {
  constructor(path) {
    super(path, 1, 100, 5);
    this.direction = "down"; // default starting direction
    this.frame = 0;          // which walking frame
  }

  updateDirection(target) {
    let dx = target.x - this.x;
    let dy = target.y - this.y;

    // Determine direction
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) {
        this.direction = "right";
      } else {
        this.direction = "left";
      }
    } else {
      if (dy > 0) {
        this.direction = "down";
      } else {
        this.direction = "up";
      }
    }

    // Cycle frames
    this.frame = frameCount % 60;
  }

  drawBody() {
    push();
    imageMode(CENTER); 

    let x = this.x;
    let y = this.y;

    // Walking down
    if (this.direction == "down") {
      if (this.frame < 30) {
        image(basicEnemyImg, x, y, 50, 100, 125, 170, 100, 0);
      } else {
        image(basicEnemyImg, x, y, 50, 100, 0, 170, 100, 0);
      }
    }

    // Walking right
    if (this.direction == "right") {
      if (this.frame < 30) {
        image(basicEnemyImg, x, y, 50, 50, 100, 0, 100, 180);
      } else {
        image(basicEnemyImg, x, y, 50, 50, 100, 0, 100, 180);
      }
    }

    // Walking left
    if (this.direction == "left") {
      if (this.frame < 30) {
        image(basicEnemyImg, x, y, 50, 50, 0, 0, 100, 180);
      } else {
        image(basicEnemyImg, x, y, 50, 50, 0, 0, 100, 180);
      }
    }

    // Walking up
    if (this.direction == "up") {
      if (this.frame < 30) {
        image(basicEnemyImg, x, y, 50, 50, 223, 0, 150, 180);
      } else {
        image(basicEnemyImg, x, y, 50, 50, 350, 0, 150, 180);
      }
    }


    pop();
  }

  draw() {
    super.draw(); // Draws body + health bar
  }

  update(infoTracker) {
    if (!this.alive) return;

    if (this.pathIndex < this.path.length) {
      let target = this.path[this.pathIndex];
      this.updateDirection(target); // update direction & frame
      this.move(target);
    } else {
      infoTracker.loseHealth(10);
      this.alive = false;
    }
  }
}
