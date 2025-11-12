
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
if (this.x < target.x) this.x += this.speed;
  if (this.x > target.x) this.x -= this.speed;
  if (this.y < target.y) this.y += this.speed;
  if (this.y > target.y) this.y -= this.speed;

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

  draw(){
    //if enemy is ever dead no function will run
    if(!this.alive) return;

    //enemy body
    push();
    fill(155, 155, 100);
    circle(this.x, this.y, 20);
    pop();

    //health bar background
    push();
    fill(0);
    rect(this.x - 10, this.y - 15, 20, 5);
    pop();

    //health bar front (active health)
    push();
    fill(255, 0, 0);
            //Returns the percentage value 1 is between 0-maxHealth
      let w = map(this.health, 0, this.maxHealth, 0, 20);
    rect(this.x - 10, this.y - 15, w, 5)
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
