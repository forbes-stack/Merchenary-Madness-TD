let enemy1;
let towers = [];
let bullets = [];
let towers1 = [];         // tower icons in the bottom UI
let placedTowers = [];   // towers that have been placed on the map
let dragging = false;
let draggedTower = null;
let dropZone;            // buildable map area


function setup() {
  createCanvas(1400, 675);

  enemy1 = new Enemy(0, 300, 1.5, 50, function(t) {
    return {
      x: t,  //No path formula yet, just moves horizontally over time for now
      y: 300
    };
  });

  let firstTower = new Tower(width / 2, height / 2);
  towers.push(firstTower);
}

function draw() {
  background(220);

  // === MAP AREA (drop zone) ===
  push();
  fill(210, 180, 140);
  rect(dropZone.x, dropZone.y, dropZone.w, dropZone.h); // Map
  pop();

  // === UI PANELS ===
  rect(0, 500, 1400, 200);             // bottom UI bar
  rect(1100, 500, 300, 200);           // box w/ health, money, wave

  // === Tower selection boxes ===
  rect(50, 525, 50, 50);
  rect(50, 625, 50, 50);
  rect(200, 525, 50, 50);
  rect(200, 625, 50, 50);
  rect(350, 525, 50, 50);
  rect(350, 625, 50, 50);
  rect(500, 525, 50, 50);
  rect(500, 625, 50, 50);
  rect(650, 525, 50, 50);
  rect(650, 625, 50, 50);
  rect(800, 525, 50, 50);
  rect(800, 625, 50, 50);
  rect(950, 525, 50, 50);
  rect(950, 625, 50, 50);

  // === Stats (Money, Health, Wave) ===
  textSize(30);
  text("Money", 1125, 550);
  text("Health", 1125, 600);
  push();
  fill(255, 0, 0);
  rect(1235, 580, 125, 25); // health bar
  pop();
  text("Wave", 1125, 650);

  // === Tower icons in the bottom bar ===
  for (let t of towers1) {
    push();
    fill(t.color);
    noStroke();
    circle(t.x, t.y, t.r);
    pop();
  }

  // === Placed towers on the map ===
  for (let t of placedTowers) {
    push();
    fill(t.color);
    noStroke();
    circle(t.x, t.y, t.r);
    pop();
  }

  // === Tower being dragged ===
  if (dragging && draggedTower) {
    push();
    fill(draggedTower.color);
    noStroke();
    circle(mouseX, mouseY, draggedTower.r);
    pop();
  }
}

function mousePressed() {
  // Check if any tower icon was clicked
  for (let t of towers) {
    let d = dist(mouseX, mouseY, t.x, t.y);
    if (d < t.r / 2) {
      draggedTower = { ...t }; // clone tower
      dragging = true;
      break;
    }
  }
}

function mouseReleased() {
  if (dragging && draggedTower) {
    // Check if dropped inside the buildable zone
    if (
      mouseX > dropZone.x &&
      mouseX < dropZone.x + dropZone.w &&
      mouseY > dropZone.y &&
      mouseY < dropZone.y + dropZone.h
    ) {
      // Place a new tower copy where released
      placedTowers.push({ ...draggedTower, x: mouseX, y: mouseY });
    }

    // stop dragging
    draggedTower = null;
    dragging = false;
  }
  enemy1.update();
  enemy1.draw();

  for (let tower of towers) {
    tower.findTarget(enemy1);
    tower.draw();
  }
}
