let bg;
let path;
let ui;
let tower1;
let enemy1;

// Load assets
function preload() {
  bg = loadImage("assets/Wild_West_Bg.png");
}

function setup() {
  createCanvas(1400, 675);

  // Create Path object instead of hardcoded array
  path = new Path([
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
  ]);

  ui = new UI(path); // Pass path to UI
  tower1 = new Tower(200, 325, 50, 2, 1);
  enemy1 = new Enemy(path.points, 1, 100);
}

function draw() {
  background(220);

  ui.display();

  // Draw and move enemy
  enemy1.update();
  enemy1.draw();

  // Draw tower and handle attacks
  tower1.draw();
  let distEnemy = dist(tower1.x, tower1.y, enemy1.x, enemy1.y);
  if (distEnemy <= tower1.range) {
    enemy1.takeDamage(tower1.damage);
  }

  // Optional: draw the path outline for testing
  path.display();
}

function mousePressed() {
  ui.mousePressed();
}

function mouseReleased() {
  ui.mouseReleased();
}