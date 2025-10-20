let enemy1;

function setup() {
  enemy1 = new Enemy(0, 300, 1.5, 50, function(t) {
    return {
      x: t,  //No path formula yet, just moves horizontally over time for now 
      y: 300
    };
  });
}

function draw() {
  enemy1.update();  //keeps track of position
  enemy1.draw();   
}

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
