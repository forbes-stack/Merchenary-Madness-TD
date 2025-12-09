// enemy.js
// General enemy object
class Enemy {
  constructor(path, speed, health, currency) {
    //just the path
    this.path = path
   this.speed = speed;
   this.maxHealth = health;
   this.health = health;
this.alive = true;
this.pathIndex = 1;
this.x = path[0].x;
this.y = path[0].y;
this.currency = currency;
  }

  // moves the enemy to the target point
  move(target){

  // added an if-else where if the enemy's location is diagonal from the current target 
  // point adds to the speed of x and a percentage of y's speed.
  if (this.x < target.x && this.y > target.y) {
    this.x += this.speed;
    this.y -= this.speed * 0.47;
  } else if (this.x < target.x && this.y < target.y) {
    this.x += this.speed;
    this.y += this.speed * 0.47;
  } else {
    if (this.x < target.x) this.x += this.speed;
    if (this.x > target.x) this.x -= this.speed;
    if (this.y < target.y) this.y += this.speed;
    if (this.y > target.y) this.y -= this.speed;
  }

//to avoid over shoot / undershoot of points, if enemy is within one "speed step"
//from the target point then snap to the point and consider reached.
    if (Math.abs(this.x - target.x) < this.speed &&
    Math.abs(this.y - target.y) < this.speed) {
  this.x = target.x; // snap exactly to target
  this.y = target.y;
  this.pathIndex++;
}
  }

  //Updates the state of the enemy
  update(infoTracker) {
if(!this.alive) return;

    if(this.pathIndex < this.path.length){

      //next set of path points
      let target = this.path[this.pathIndex];
      this.move(target);

    } else{
      infoTracker.loseHealth(10); // user loses 10 health
      this.alive = false;
    }
  }

  // NEW: This is the method that subclasses must override to draw their unique shape.
  drawBody() {
      // Placeholder method
  }

  // The main draw method. Subclasses call super.draw() to get the health bar.
  draw() {
    if (!this.alive) return;

    this.drawBody(); // Draw the unique shape (implemented by subclass)

    // Health bar background (Now centralized in the base class)
    push();
    fill(0);
    rect(this.x - 10, this.y - 15, 20, 5);
    pop();

    // Health bar foreground
    push();
    fill(255, 0, 0);
    let w = map(this.health, 0, this.maxHealth, 0, 20);
    rect(this.x - 10, this.y - 15, w, 5);
    pop();
  }

takeDamage(amount, infoTracker) {
  if (!this.alive) return;

  this.health -= amount;

  if(this.health <= 0) {
    this.alive = false;
    infoTracker.addCurrency(this.currency); // kill reward for enemy
  }
}
}
