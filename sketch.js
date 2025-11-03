let bg;
let path;
let ui;
let tower1;
let enemy1;
let enemy2;          // <-- declare enemy2
let uiBg;
let info;
let enemy2Spawned = false;

// Load assets
function preload() {
  bg = loadImage("assets/Wild_West_Bg.png");
  uiBg = loadImage("assets/woodBack.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);

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

  // Pass assets into UI so it can render background and palette with tower objects
  ui = new UI(path, { bg, uiBg });

  info = new InfoTracker(100, 1);

  // Existing sample tower & enemy (kept as-is; placed towers via UI are separate)
  tower1 = new Tower(200, 325, 30, 2, 1);
  enemy1 = new Enemy(path.points, 1, 100);
}

function draw() {
  background(220);

  // UI (draws bg, palette tiles, placed towers, and ghost tower while dragging)
  ui.display();

  // Enemies
  enemy1.update();
  enemy1.draw();

  if (millis() > 2000 && !enemy2Spawned) {
    enemy2 = new Enemy(path.points, 1, 100, 100);
    enemy2Spawned = true;
  }
  if (enemy2Spawned) {
    enemy2.update();
    enemy2.draw();
  }

  // Existing sample tower drawing/attack (independent of UI-placed towers)
  tower1.draw();
  let distEnemy = dist(tower1.x, tower1.y, enemy1.x, enemy1.y);
  if (distEnemy <= tower1.range) {
    enemy1.takeDamage(tower1.damage);
  }

  // Optional: draw the path outline for testing
  path.display();

  // HUD
  info.draw();
}

// Forward mouse events to UI so TowerDragger can do its thing
function mousePressed() {
  ui.mousePressed();
}

function mouseDragged() {
  if (ui.mouseDragged) ui.mouseDragged();
}

function mouseMoved() {
  if (ui.mouseMoved) ui.mouseMoved();
}

function mouseReleased() {
  ui.mouseReleased();
}

// (Optional) keep things responsive
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
