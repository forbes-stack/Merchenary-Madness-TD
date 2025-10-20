let towers = [];
let bullets = [];
let enemy;

let isPlacingTower = false; // is the user dragging the tower
let towerToPlace = null; // the tower object the user is dragging

class Tower {
  constructor(x, y) {
    this.x = x;
    this.y= y;
    this.range = 50; // The tower's engagement radius in pixels
    this.target = null;
    this.angle = 0;
    this.fireRate = 600;
    this.lastShotTime = 0;
    this.cost = 50; // tower costs 50 currency to place
  }

  draw() {
    // draw the engagement radius
    noFill();
    stroke(0, 0, 255, 50);
    strokeWeight(2);
    circle(this.x, this.y, this.range * 2);

    // draw the towers body
    fill(0, 100, 255);
    noStroke();
    circle(this.x, this.y, this.size);
    }

  findTarget(enemy) {
    // calculates the distance to the enemy
    let d = dist(this.x, this.y, enemy.x, enemy.y);

    // if enemy is in range of tower radius, select target
    if ( d < this.range) {
      this.target = enemy;
    } else {
      this.target = null; // if enemy is not in range, no target selected
    }
  }

  shoot() {
    // create a new bullet in the direction of target
    let bullet = new Bullet(this.x, this.y, this.angle);
    bullets.push(bullet); // add to the game's list of active bullets
  }
}

class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.speed = 8;
    this.radius = 5;

    // convert angle and speed into X and Y velocity
    this.velX = this.speed * cos(angle);
    this.velY = this.speed * sin(angle);
  }

  update() {
    // moves the bullet based on X and Y velocity
    this.x += this.velX;
    this.y += this.velY;
  }

  hits(enemy) {
    // check for a collision using distance
    let d = dist(this.x, this.y, enemy.x, enemy.y);
    return d < this.radius + enemy.radius;
  }

  draw() {
    fill(255, 255, 0);
    noStroke();
    circle(this.x, this.y, this.radius * 2);
  }
}
