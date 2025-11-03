// Tower.js (your class with an optional ghost drawer)
class Tower{
  constructor(x, y, range, damage, rate){
    this.x = x;
    this.y = y;
    this.range = range;
    this.damage = damage;
    this.rate = rate
    this.cooldown = 0;
  }

  update(enemy){
    if(!enemy.alive) return;

    if (this.cooldown > 0) {
      this.cooldown--;
      return;
    }

    let distEnemy = dist(this.x, this.y, enemy.x, enemy.y);

    if(distEnemy <= this.range) {
      enemy.takeDamage(this.damage)
      this.cooldown = Math.ceil(this.rate * 60);
    }
  }

  draw() {
    // tower body
    fill(100, 100, 255);
    circle(this.x, this.y, 30);

    // range ring
    noFill();
    stroke(0, 0, 255, 50);
    circle(this.x, this.y, this.range * 2);
  }

  // Optional: semi-transparent “ghost” when dragging
  drawGhost() {
    push();
    // range ring
    noFill();
    stroke(0, 0, 255, 60);
    circle(this.x, this.y, this.range * 2);
    // body
    noStroke();
    fill(100, 100, 255, 160);
    circle(this.x, this.y, 30);
    pop();
  }
}
