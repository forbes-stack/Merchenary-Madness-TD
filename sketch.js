function setup() {
  createCanvas(1400, 650);

  enemy1 = new Enemy(0, 300, 1.5, 50, function(t) {
    return {
      x: t,  //No path formula yet, just moves horizontally over time for now 
      y: 300
    };
  });
}

function draw() {
  background(220);
  rect(0,500,1400,200);
  rect(1100,500,300,200);

  rect(50, 525, 50,50);

  enemy1.draw();

}