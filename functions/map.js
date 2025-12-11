// map.js

//Backgrounds
let bg;
let uiBg;
let longBg;

let path;
let ui;
let info;
let waveManager;

let enemy1;
let enemy2;

//Buttons
let startWaveButton;
let pauseButton;      // pause icon button
let isPaused = false; // pause flag

//Icons
let gattlingIcon;
let cowboyIcon;
let cannonIcon;
let sniperIcon;

//Towers
let cowboyTower;
let sniperTowerImg;
let gatlingTowerImg;
let cannonTowerImg;

//Enemies
let fastEnemyImg;
let basicEnemyImg;


function mapPreload() {
  
  //Backgrounds
  bg = loadImage("assets/Wild_West_Bg.png");
  uiBg = loadImage("assets/woodBack.png");
  longBg = loadImage("assets/dusty2.jpg");

  //Icons
  gattlingIcon = loadImage("assets/gattlingIcon.png");
  cowboyIcon = loadImage("assets/Cowboy_Icon.png");
  cannonIcon = loadImage("assets/cannonIcon.png");
  sniperIcon = loadImage("assets/sniperIcon.png");

  //Towers
  cowboyTower = loadImage("assets/basic_tower3.png");
  sniperTowerImg = loadImage("assets/sniper_tower.png");
  gatlingTowerImg = loadImage("assets/gatling_tower.png")
  cannonTowerImg = loadImage("assets/cannon_tower1.png")

  //Enemies
  fastEnemyImg = loadImage("fast_enemy.png");
  basicEnemyImg = loadImage("basic_enemy.png");
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
  ui = new UI(path, { bg, uiBg, 
                      gattlingIcon, 
                      cowboyIcon, 
                      cannonIcon, 
                      sniperIcon, 
                      cowboyTower,
                      sniperTowerImg,
                      gatlingTowerImg,
                      cannonTowerImg,
                    }
                  );

  // HUD / currency / lives tracker
  info = new InfoTracker(100, 1);

  // Create Pause + Start Wave buttons
  createTopButtons();

  // Wave manager, but DO NOT auto-start the first wave
  waveManager = new WaveManager(path);

  // Start in "waiting for player" state so Wave 1 starts only after button press
  waveManager.waitingForPlayer = true;
}

function mapDraw() {
  background('white');

  // Show or hide Start Wave button based on WaveManager + state
  if (waveManager && waveManager.waitingForPlayer && !isPaused && !info.isGameOver) {
    startWaveButton.show();
  } else {
    startWaveButton.hide();
  }

  // Pause icon should only be visible when not game over
  if (pauseButton) {
    if (!info.isGameOver) pauseButton.show();
    else pauseButton.hide();
  }

  // --- Game Over state ---
  if (info && info.isGameOver) {
    // Hide buttons while game over
    startWaveButton.hide();
    if (pauseButton) pauseButton.hide();

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

  // --- Paused state ---
  if (isPaused) {
    // Draw current game state without updating logic
    image(bg, 0, 0, width, height - 250);
    image(longBg, 0, height - 250, width, 250);

    // Draw towers without updating them: pass null so t.update(...) is skipped
    ui.display(info, null);

    // Draw enemies at their last positions (no update)
    if (waveManager) {
      waveManager.draw();
    }

    // HUD
    info.draw();

    // Pause overlay with Resume / Restart
    ui.displayPauseMenu();

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

  // If paused, click goes to pause menu (Resume / Restart)
  if (isPaused) {
    ui.handlePauseClick(
      () => { isPaused = false; }, // resume callback
      restartGame                  // restart callback (same as Game Over)
    );
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

/**
 * Create Pause icon + Start Wave button at the top-right area,
 * with some breathing room from the corner.
 */
function createTopButtons() {
  const topY = 40;
  const buttonHeight = 40;

  // Base X a bit away from the right edge so nothing feels crammed
  const baseX = width - 260; // left-most button x

  // --- Pause icon button (left of Start Wave) ---
  pauseButton = createButton("⏸"); // Unicode pause icon
  pauseButton.position(baseX, topY);
  pauseButton.size(40, buttonHeight);
  pauseButton.style("font-size", "20px");
  pauseButton.style("background-color", "#444");
  pauseButton.style("color", "white");
  pauseButton.style("border", "2px solid #222");
  pauseButton.style("border-radius", "8px");
  pauseButton.style("cursor", "pointer");
  pauseButton.mousePressed(() => {
    if (!info.isGameOver) {
      isPaused = !isPaused;
    }
  });

  // --- Start Wave button (shifted left, to the right of the icon) ---
  startWaveButton = createButton("Start Wave");
  startWaveButton.position(baseX + 50, topY);  // moved left vs old width-130
  startWaveButton.size(130, buttonHeight);

  // Styling
  startWaveButton.style("font-size", "16px");
  startWaveButton.style("background-color", "#c97a2b");
  startWaveButton.style("color", "white");
  startWaveButton.style("border", "2px solid #603814");
  startWaveButton.style("border-radius", "8px");
  startWaveButton.style("cursor", "pointer");

  // Hook it up to WaveManager
  startWaveButton.mousePressed(() => {
    waveManager.startNextWave(info); // this will start Wave 1 the first time
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

  // Clear pause state
  isPaused = false;

  // Reset WaveManager and start fresh, waiting for player again
  waveManager = new WaveManager(path);
  waveManager.waitingForPlayer = true;
}

// Toggle pause with the P key (still supported)
function keyPressed() {
  if (key === 'p' || key === 'P') {
    // Don’t allow pausing if game over
    if (!info.isGameOver) {
      isPaused = !isPaused;
    }
  }
}
