let bg;
let path;
let ui;
let tower1;
let enemy1;
let enemy2;
let uiBg;
let info;
let enemy2Spawned = false;
let towers;
let enemies;

// Load assets
function preload() {
  bg = loadImage("assets/Wild_West_Bg.png");
  uiBg = loadImage("assets/woodBack.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Create Path object instead of hardcoded array
  path = new Path([
    { x: 220, y: 440 },
    { x: 220, y: 360 },
    { x: 135, y: 360 },
    { x: 135, y: 325 },
    { x: 100, y: 325 },
    { x: 100, y: 155 },
    { x: 410, y: 160 },
    { x: 517, y: 203 },
    { x: 649, y: 157 },
    { x: 866, y: 159 },
    { x: 864, y: 273 },
    { x: 984, y: 276 },
    { x: 986, y: 296 },
    { x: 1051, y: 299 },
    { x: 1054, y: 353 },
    { x: 1258, y: 351 },
  ]);

  // Pass assets into UI so it can render background and palette with tower objects
  ui = new UI(path, { bg, uiBg });

  // This is our main info tracker
  info = new InfoTracker(100, 1);

  waveManager = new WaveManager(waves);
  waveManager.startWave();
}

function draw() {
  if (info && info.isGameOver) {


    // Draw the background one last time
    image(bg, 0, 0, width, height);
    // Draw the path
    path.display();
    // Draw towers from UI
    ui.displayGameOver();


    // Darken the screen
    push();
    fill(0, 0, 0, 150); // Semi-transparent black
    rect(0, 0, width, height);
    pop();

    // Draw the HUD
    info.draw();

    // Draw Game Over Text
    push();
    fill(255, 0, 0); // Red
    textSize(80);
    textAlign(CENTER, CENTER);
    stroke(0);
    strokeWeight(4);
    text("GAME OVER", width / 2, height / 2);
    pop();

    return;
  }


  // We draw the background image first
  image(bg, 0, 0, width, height);

  ui.display(info);

   waveManager.update(info);
  waveManager.draw();

  if (!waveManager.waveActive && !waveManager.isComplete()) {
    // You can trigger next wave automatically or wait for user input
    waveManager.startNextWave();
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
