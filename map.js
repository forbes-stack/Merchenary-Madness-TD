let bg;
let path;
let ui;
let tower1;
let enemy1;
let enemy2;
let uiBg;
let info;
let enemy2Spawned = false;

function mapSetup() {
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

  // Existing sample tower & enemy (kept as-is; placed towers via UI are separate)
  tower1 = new Tower(200, 325, 30, 2, 1);

  // Give enemies health and currency values
  enemy1 = new Enemy(path.points, 1, 100, 10); // 100 health, 10 currency
}

function mapDraw() {
   if (info && info.isGameOver) {


    // Draw the background one last time
    image(bg, 0, 0, width, height);
    // Draw the path
    path.display();
    // Draw towers from UI
    ui.displayGameOver();

    // Draw the sample tower
    tower1.draw();

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

  // Enemies
  if (enemy1.alive) {
    enemy1.update(info);
    enemy1.draw();
  }

  if (millis() > 2000 && !enemy2Spawned) {
    enemy2 = new Enemy(path.points, 1, 100, 15); // 100 health, 15 currency
    enemy2Spawned = true;
  }

  if (enemy2Spawned && enemy2.alive) {
    enemy2.update(info);
    enemy2.draw();
  }

  tower1.draw();

  // This tower will try to attack both enemies
  // We call tower1.update() instead of the manual distance check
  if (enemy1.alive) {
    tower1.update(enemy1, info);
  }
  if (enemy2Spawned && enemy2.alive) {
    tower1.update(enemy2, info);
  }

  // Optional: draw the path outline for testing
  path.display();

  // HUD
  info.draw();
}