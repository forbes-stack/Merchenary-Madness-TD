// sketch.js
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
let gattlingIcon;
let cowboyIcon;
let cannonIcon;
let sniperIcon;

function preload() {
  bg = loadImage("assets/Wild_West_Bg.png");
  uiBg = loadImage("assets/woodBack.png");
  longBg = loadImage("assets/dusty2.jpg");
  gattlingIcon = loadImage("assets/gattlingIcon.png");
  cowboyIcon = loadImage("assets/Cowboy_Icon.png");
  cannonIcon = loadImage("assets/cannonIcon.png");
  sniperIcon = loadImage("assets/sniperIcon.png");
}

function setup() {
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
  ui = new UI(path, { bg, uiBg, gattlingIcon, cowboyIcon, cannonIcon, sniperIcon });

  // HUD / currency / lives tracker
  info = new InfoTracker(100, 1);

  createStartWaveButton();

  waveManager = new WaveManager(path);
  waveManager.startWave(info);
}

function draw() {
  background('white');

  // Show or hide Start Wave button based on WaveManager
  if (waveManager && waveManager.waitingForPlayer) startWaveButton.show();
  else startWaveButton.hide();

  // --- Game Over state ---
  if (info && info.isGameOver) {
    // Hide the start wave button while game over
    startWaveButton.hide();

    // Draw background like a frozen game state
    image(bg, 0, 0, width, height - 250);
    image(longBg, 0, height - 250, width, 250);

    // Draw HUD so player still sees final stats
    info.draw();

    // Draw Game Over overlay + Restart button
    ui.displayGameOver();

    // Stop updating game logic
    return;
  }

  // --- Normal game loop ---

  // Background
  image(bg, 0, 0, width, height - 250);
  image(longBg, 0, height - 250, width, 250);

  // UI draws palette, placed towers, and updates towers against enemies
  ui.display(info, waveManager.activeEnemies);

  // Update and draw enemies / waves
  waveManager.update(info);
  waveManager.draw();

  // HUD
  info.draw();
}

// Forward mouse events to UI so TowerDragger can do its thing
function mousePressed() {
  // If game is over, check only the restart button
  if (info && info.isGameOver) {
    ui.handleGameOverClick(restartGame);
    return;
  }

  ui.mousePressed(info);
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

/**
 * Restart the game back to the original starting round
 * and clear towers/enemies.
 */
function restartGame() {
  // Reset tracked info (health, gold, round, isGameOver)
  info.reset();

  // Clear towers
  ui.placedTowers = [];
  ui.selectedTower = null;

  // Reset WaveManager and start fresh
  waveManager = new WaveManager(path);
  waveManager.startWave(info);
}
