// map.js
let bg;
let path;
let ui;
let enemy1;
let enemy2;
let uiBg;
let info;
let waveManager;
let longBg;
let startWaveButton;


function mapPreload() {
  bg = loadImage("assets/Wild_West_Bg.png");
  uiBg = loadImage("assets/woodBack.png");
  gameover = loadImage('assets/gameover.png')
  longBg = loadImage("assets/dusty2.jpg")
}


function mapSetup() {
  createCanvas(1400, 750);

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

  createStartWaveButton();

  waveManager = new WaveManager(path);
  waveManager.startWave(info);
}

function mapDraw() {
  background('white');


  if (waveManager.waitingForPlayer) startWaveButton.show();
else startWaveButton.hide();

// Game Over overlay
  if (info && info.isGameOver) {
    image(bg, 0, 0, width, height);
    ui.displayGameOver();

    // Darken screen
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
  /* Height - 250 is to re-align menu screen */
  image(bg, 0, 0, width, height - 250);
image(longBg, 0, height - 250, width, 250);
  // UI draws palette, placed towers, and updates towers against enemies
  ui.display(info, waveManager.activeEnemies);

  waveManager.update(info);
  waveManager.draw();

  // Optional: draw the path outline

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
  ui.mouseReleased(info); // pass InfoTracker so the dragger can charge
}

function createStartWaveButton() {
  startWaveButton = createButton("Start Wave");

  // Position in top-right of canvas
  startWaveButton.position(width - 130, 40);
  startWaveButton.size(110, 40);

  // Styling
  startWaveButton.style("font-size", "16px");
  startWaveButton.style("background-color", "#c97a2b");
  startWaveButton.style("color", "white");
  startWaveButton.style("border", "2px solid #603814");
  startWaveButton.style("border-radius", "8px");
  startWaveButton.style("cursor", "pointer");

  // Hook it up to WaveManager
  startWaveButton.mousePressed(() => {
  waveManager.startNextWave(info);
  });
}