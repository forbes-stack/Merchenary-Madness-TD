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
let speedButton;      // 1x / 2x toggle (SpeedButton.js)
let gameSpeed = 1;    // game steps per frame, set by speedButton
let isPaused = false; // pause flag
let settingsOpen = false; // Settings panel open from the pause menu
let tutorial;         // guided first round (tutorial.js)
let showStats = false; // FPS / entity overlay, toggled with the F key

//Icons
let gattlingIcon;
let cowboyIcon;
let cannonIcon;
let sniperIcon;
let homeIcon;         // house icon on the Quit to Title buttons

//Towers
let cowboyTower;
let sniperTowerImg;
let gatlingTowerImg;
let cannonTowerImg;

//Enemies
let fastEnemyImg;
let basicEnemyImg;
let tankEnemyImg;
let dynamiteEnemyImg;
let ghostEnemyImg;
let docEnemyImg;
let ironcladEnemyImg;



// Loads every map image, then calls onDone once all of them have finished
// (this runs after setup, so p5's preload() can't wait for us)
function mapPreload(onDone) {
  let pending = 0;
  const finished = () => {
    pending--;
    if (pending === 0 && onDone) onDone();
  };
  const load = (src) => {
    pending++;
    return loadImage(src, finished, () => {
      console.error('failed to load image', src);
      finished();
    });
  };

  //Backgrounds
  bg = load("assets/Wild_West_Bg.png");
  uiBg = load("assets/woodBack.png");
  longBg = load("assets/dusty2.jpg");

  //Icons
  gattlingIcon = load("assets/gattlingIcon.png");
  cowboyIcon = load("assets/Cowboy_Icon.png");
  cannonIcon = load("assets/cannonIcon.png");
  sniperIcon = load("assets/sniperIcon.png");
  homeIcon = load("assets/home.png");

  //Towers
  cowboyTower = load("assets/basic_tower3.png");
  sniperTowerImg = load("assets/sniper_tower.png");
  gatlingTowerImg = load("assets/gatling_tower.png")
  cannonTowerImg = load("assets/cannon_tower1.png")

  //Enemies
  fastEnemyImg = load("assets/fast_enemy.png");
  basicEnemyImg = load("assets/basic_enemy.png");
  tankEnemyImg = load("assets/tank_enemy.png")

  //Special enemies (standard grid sheets, see enemies/gridEnemy.js)
  dynamiteEnemyImg = load("assets/dynamite_enemy.png");
  ghostEnemyImg = load("assets/ghost_enemy.png");
  docEnemyImg = load("assets/doc_enemy.png");
  ironcladEnemyImg = load("assets/ironclad_enemy.png");
}


function mapSetup() {
  createCanvas(1400, 750);
  canvasLayout.fit(); // scale the bigger map canvas to the window

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
                      homeIcon,
                    }
                  );

  // Guided tutorial (offered until finished or skipped) and visual effects
  tutorial = new Tutorial();
  effects.clear();

  // HUD / currency / lives tracker
  // Round 0 = no wave started yet (the HUD shows it as Round 1)
  info = new InfoTracker(100, 0);

  // Create Pause + Start Wave buttons
  createTopButtons();

  // 1x / 2x speed toggle, drawn on the canvas just left of the Pause button
  speedButton = new SpeedButton(width - 320, 40, 50, 40);

  // the strip behind the speed / Pause / Start Wave controls: no towers there,
  // and tower menus don't open underneath it
  ui.reservedRects.push({ x: width - 325, y: 0, w: 255, h: 85 });

  // Wave manager, but DO NOT auto-start the first wave
  waveManager = new WaveManager(path);

  // Start in "waiting for player" state so Wave 1 starts only after button press
  waveManager.waitingForPlayer = true;

  // Western music loop (stops on Game Over, starts again on Restart)
  sfx.startMusic();
}

function mapDraw() {
  background('white');

  // Show or hide Start Wave button based on WaveManager + state
  if (waveManager && waveManager.waitingForPlayer && !isPaused && !info.isGameOver &&
      !tutorial.blocksWaveStart()) {
    startWaveButton.show();
  } else {
    startWaveButton.hide();
  }

  // Pause icon should only be visible when not game over (and not over the Settings panel)
  if (pauseButton) {
    if (!info.isGameOver && !settingsOpen) pauseButton.show();
    else pauseButton.hide();
  }

  // --- Game Over state ---
  if (info && info.isGameOver) {
    // Hide buttons while game over
    startWaveButton.hide();
    if (pauseButton) pauseButton.hide();

    // Draw background like a frozen game state
    drawMapBackground();

    // Draw HUD so player still sees final stats
    info.draw(ui.placedTowers.length);

    // Draw Game Over overlay + Restart button
    ui.displayGameOver();

    // Stop updating game logic
    return;
  }

  // --- Paused state ---
  if (isPaused) {
    // Draw current game state without updating logic
    drawMapBackground();

    // Draw towers without updating them: pass null so t.update(...) is skipped
    ui.display(info, null, false);

    // Draw enemies at their last positions (no update)
    if (waveManager) {
      waveManager.draw();
    }
    effects.draw();

    // HUD
    info.draw(ui.placedTowers.length);
    speedButton.draw();

    if (settingsOpen) {
      // Settings panel centered over the dimmed, paused game
      push();
      fill(0, 0, 0, 160);
      noStroke();
      rect(0, 0, width, height);
      pop();
      settingsDraw();
    } else {
      // Pause overlay with Resume / Restart / Settings / Quit to Title
      ui.displayPauseMenu();
    }

    return;
  }

  // --- Normal game loop ---

  // Background
  drawMapBackground();

  // Extra game steps when sped up (2x runs the game logic twice per frame)
  for (let step = 1; step < gameSpeed; step++) {
    ui.updateTowers(waveManager.activeEnemies, info);
    waveManager.update(info);
    effects.update();
  }

  // UI draws palette, placed towers, and updates towers against enemies
  ui.display(info, waveManager.activeEnemies);

  // Update and draw enemies / waves
  waveManager.update(info);
  waveManager.draw();

  // Dust, floating costs, sparkles
  effects.update();
  effects.draw();

  // Tutorial prompts (after ui.display so upgrade button positions are known)
  tutorial.update(ui, info);
  tutorial.draw(ui, info);

  // HUD
  info.draw(ui.placedTowers.length);
  speedButton.draw();
  if (showStats) drawStats();
}

// Rolling average of frame times for the stats overlay
let frameTimes = [];

/**
 * Performance overlay (F key): FPS, frame time, and what's on screen.
 */
function drawStats() {
  frameTimes.push(deltaTime);
  if (frameTimes.length > 60) frameTimes.shift();
  const avgMs = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;

  const lines = [
    `FPS: ${Math.round(1000 / avgMs)}`,
    `Frame: ${avgMs.toFixed(1)} ms`,
    `Enemies: ${waveManager.activeEnemies.length}`,
    `Towers: ${ui.placedTowers.length}`,
    `Effects: ${effects.items.length}`,
    `Speed: ${gameSpeed}x`,
  ];

  push();
  rectMode(CORNER);
  fill(0, 0, 0, 170);
  noStroke();
  rect(8, 8, 150, 18 * lines.length + 12, 6);
  fill(255);
  textAlign(LEFT, TOP);
  textSize(14);
  textFont('monospace');
  lines.forEach((l, i) => text(l, 16, 14 + i * 18));
  pop();
}

/**
 * Back to the start screen. Reloading the page is the cleanest reset, since the
 * game's scripts replace the start screen's input handlers when they load.
 * Settings are saved in the browser, so they survive the reload.
 */
function quitToTitle() {
  sfx.stopMusic();
  location.reload();
}

/**
 * Map art and the bottom strip behind the palette.
 */
function drawMapBackground() {
  image(bg, 0, 0, width, height - 250);
  image(longBg, 0, height - 250, width, 250);
}

// Forward mouse events to UI so TowerDragger can do its thing
function mousePressed() {
  // If game is over, check only the restart button
  if (info && info.isGameOver) {
    ui.handleGameOverClick(restartGame, quitToTitle);
    return;
  }

  // Settings panel: its sliders/buttons are HTML controls that handle their own clicks
  if (settingsOpen) return;

  // If paused, click goes to pause menu (Resume / Restart / Settings / Quit to Title)
  if (isPaused) {
    ui.handlePauseClick(
      () => { isPaused = false; }, // resume callback
      restartGame,                 // restart callback (same as Game Over)
      quitToTitle,
      openPauseSettings
    );
    return;
  }

  // Tutorial panel buttons (Show me / Skip / Got it)
  if (tutorial.handleClick()) return;

  // 1x / 2x toggle
  if (speedButton.handleClick(mouseX, mouseY)) return;

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

// Touch: a finger works like the mouse (tap = click, drag = drag a tower).
// For touches on the canvas, returning false stops the browser from also sending
// emulated mouse events (which would click twice, e.g. buy an upgrade twice) and
// from scrolling the page. Touches on HTML buttons keep their normal behavior.
function touchOnCanvas(e) {
  return e && e.target && e.target.tagName === 'CANVAS';
}

function touchStarted(e) {
  mousePressed();
  if (touchOnCanvas(e)) return false;
}

function touchMoved(e) {
  mouseDragged();
  if (touchOnCanvas(e)) return false;
}

function touchEnded(e) {
  mouseReleased();
  if (touchOnCanvas(e)) return false;
}

/**
 * Create Pause icon + Start Wave button at the top-right area,
 * with some breathing room from the corner.
 */
function createTopButtons() {
  const buttonHeight = 40;

  // --- Pause icon button (left of Start Wave) ---
  pauseButton = createButton("⏸"); // Unicode pause icon
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

  // Styling
  startWaveButton.style("background-color", "#c97a2b");
  startWaveButton.style("color", "white");
  startWaveButton.style("border", "2px solid #603814");
  startWaveButton.style("border-radius", "8px");
  startWaveButton.style("cursor", "pointer");

  // Hook it up to WaveManager
  startWaveButton.mousePressed(() => {
    waveManager.startNextWave(info); // this will start Wave 1 the first time
  });

  // Placed in canvas coordinates; canvasLayout scales them with the canvas
  const topY = 40;

  // Base X a bit away from the right edge so nothing feels crammed
  const baseX = width - 260; // left-most button x

  canvasLayout.place(pauseButton, baseX, topY, 40, buttonHeight, 20);
  canvasLayout.place(startWaveButton, baseX + 50, topY, 130, buttonHeight, 16);  // moved left vs old width-130
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

  effects.clear();
  tutorial.onRestart();

  // Clear pause state and go back to normal speed
  isPaused = false;
  speedButton.isFast = false;
  gameSpeed = 1;

  // Reset WaveManager and start fresh, waiting for player again
  waveManager = new WaveManager(path);
  waveManager.waitingForPlayer = true;

  sfx.startMusic();
}

/**
 * Open the Settings panel (same one as the start screen) from the pause menu,
 * centered over the map; Back returns to the pause menu.
 */
function openPauseSettings() {
  settingsOpen = true;
  openSettings(() => { settingsOpen = false; },
    (width - SETTINGS_W) / 2, (height - SETTINGS_H) / 2);
}

// Toggle pause with the P key (still supported)
function keyPressed() {
  // stay paused while the Settings panel is open (use its Back button)
  if (settingsOpen) return;

  if (key === 'p' || key === 'P') {
    // Don’t allow pausing if game over
    if (!info.isGameOver) {
      isPaused = !isPaused;
    }
  }

  // Toggle the FPS / entity overlay with the F key
  if (key === 'f' || key === 'F') {
    showStats = !showStats;
  }
}
