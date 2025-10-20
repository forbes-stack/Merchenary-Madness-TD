function setup() {
  createCanvas(1400, 675);

  enemy1 = new Enemy(0, 300, 1.5, 50, function(t) {
    return {
      x: t,  //No path formula yet, just moves horizontally over time for now 
      y: 300
    };
  });

  tower1 = new Tower(300, 300);
}

function draw() {
  background(220);
  rect(0,500,1400,200);
  rect(1100,500,300,200); // box w/ health, money, wave

  // tower selection boxes
  rect(50, 525, 50,50);
  rect(50, 625, 50,50);
  
  rect(200, 525, 50,50);
  rect(200, 625, 50,50);
  
  rect(350, 525, 50,50);
  rect(350, 625, 50,50);
  
  rect(500, 525, 50,50);
  rect(500, 625, 50,50);
  
  rect(650, 525, 50,50);
  rect(650, 625, 50,50);
  
  rect(800, 525, 50,50);
  rect(800, 625, 50,50);
  
  rect(950, 525, 50,50);
  rect(950, 625, 50,50);
  
  textSize(30);
  text("Money", 1125,550);
  
  text("Health", 1125, 600);
  rect(1235, 580, 125, 25); // health bar
  
  text("Wave", 1125, 650);

  enemy1.update();
  enemy1.draw();

tower1.draw();

}