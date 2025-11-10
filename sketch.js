// sketch.js
let bg;
let path;
let ui;
let enemy1;
let enemy2;
let uiBg;
let info;
let enemy2Spawned = false;
<<<<<<< Updated upstream
let towers;
let enemies;
=======
let enemies = []; // central list of all enemies
>>>>>>> Stashed changes

function preload() {
  bg = loadImage("assets/Wild_West_Bg.png");
  uiBg = loadImage("assets/woodBack.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Path (polyline points)
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

  // UI (drag & drop towers)
  ui = new UI(path, { bg, uiBg });

  // HUD / currency / lives tracker
  info = new InfoTracker(100, 1);

<<<<<<< Updated upstream
  waveManager = new WaveManager(waves);
  waveManager.startWave();
=======
  // First enemy: 100 HP, 10 currency reward
  enemy1 = new Enemy(path.points, 1, 100, 10);
  enemies.push(enemy1);
>>>>>>> Stashed changes
}

function draw() {
  // Game Over overlay
  if (info && info.isGameOver) {
    image(bg, 0, 0, width, height);
    path.display();
    ui.displayGameOver();

<<<<<<< Updated upstream

    // Darken the screen
=======
    // Darken screen
>>>>>>> Stashed changes
    push();
    fill(0, 0, 0, 150);
    rect(0, 0, width, height);
    pop();

    info.draw();

    push();
    fill(255, 0, 0);
    textSize(80);
    textAlign(CENTER, CENTER);
    stroke(0);
    strokeWeight(4);
    text("GAME OVER", width / 2, height / 2);
    pop();

    return;
  }

  // Normal game loop

  // Background
  image(bg, 0, 0, width, height);

<<<<<<< Updated upstream
  ui.display(info);

   waveManager.update(info);
  waveManager.draw();

  if (!waveManager.waveActive && !waveManager.isComplete()) {
    // You can trigger next wave automatically or wait for user input
    waveManager.startNextWave();
  }
 

  // Optional: draw the path outline for testing
=======
  // UI draws palette, placed towers, and updates towers against enemies
  ui.display(info, enemies);

  // Spawn second enemy after 2 seconds
  if (millis() > 2000 && !enemy2Spawned) {
    enemy2 = new Enemy(path.points, 1, 100, 15); // 100 HP, 15 currency
    enemies.push(enemy2);
    enemy2Spawned = true;
  }

  // Update & draw all enemies
  for (let e of enemies) {
    if (e && e.alive) {
      e.update(info);
      e.draw();
    }
  }

  // Optional: draw the path outline
>>>>>>> Stashed changes
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

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
