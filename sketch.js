let bg;
let pathCords = [
  {x: 220, y: 440},
  {x: 220, y: 360},
  {x: 135, y: 360},
  {x: 135, y: 325},
  {x: 100, y: 325},
  {x: 100, y: 155},
  {x: 410, y: 160},
  {x: 517, y: 203},
  {x: 649, y: 157},
  {x: 866, y: 159},
  {x: 864, y: 273},
  {x: 984, y: 276},
  {x: 986, y: 296},
  {x: 1051, y: 299},
  {x: 1054, y: 353},
  {x: 1258, y: 351}
]

//Used to load in all images or sound that we want to use
function preload() {
bg = loadImage("assets/Wild_West_Bg.png")
}

function setup() {
  createCanvas(1400, 675);

  tower1 = new Tower(200, 325, 100, 2, 1);
  enemy1 = new Enemy(pathCords, 1, 100);
}

function draw() {
  background(220); 
  image(bg, 0, 0, 1400, 500);

fill(240, 200, 135);
rect(0, 500, 1400, 675);

  enemy1.update();
  enemy1.draw();

  
  tower1.draw();
  let distEnemy = dist(tower1.x, tower1.y, enemy1.x, enemy1.y);
if(distEnemy <= tower1.range){
  enemy1.takeDamage(tower1.damage);
}
}


