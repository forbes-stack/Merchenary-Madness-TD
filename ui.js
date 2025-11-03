class UI {
  constructor(path) {
    this.path = path; // store reference to path
    this.dropZone = { x: 0, y: 0, w: 1400, h: 500 };

    this.towers = [
      { x: 75, y: 550, r: 45, color: color(0), type: "basic" },
    ];
    this.placedTowers = [];

    this.dragging = false;
    this.draggedTower = null;
    this.bg = bg;
    this.uiBg = uiBg;
  }

  display() {
    background(220);
    image(this.bg, 0, 0, windowWidth, windowHeight-200);

    // Bottom UI panels
    

    // Tower selection boxes
    let boxes = [
      [50, 525], [50, 625], [200, 525], [200, 625],
      [350, 525], [350, 625], [500, 525], [500, 625],
      [650, 525], [650, 625], [800, 525], [800, 625],
      [950, 525], [950, 625]
    ];
    for (let [x, y] of boxes) rect(x, y, 50, 50);

    // Tower icons
    for (let t of this.towers) {
      push();
      fill(t.color);
      noStroke();
      circle(t.x, t.y, t.r);
      pop();
    }

    // Placed towers
    for (let t of this.placedTowers) {
      push();
      fill(t.color);
      noStroke();
      circle(t.x, t.y, t.r);
      pop();
    }

    // Tower being dragged
    if (this.dragging && this.draggedTower) {
      push();
      fill(this.draggedTower.color);
      noStroke();
      circle(mouseX, mouseY, this.draggedTower.r);
      pop();
    }
  }

  mousePressed() {
    // Start dragging tower if clicked on icon
    for (let t of this.towers) {
      let d = dist(mouseX, mouseY, t.x, t.y);
      if (d < t.r / 2) {
        this.draggedTower = { ...t };
        this.dragging = true;
        break;
      }
    }
  }

  mouseReleased() {
    if (this.dragging && this.draggedTower) {
      // Check if released inside map area
      if (
        mouseX > this.dropZone.x &&
        mouseX < this.dropZone.x + this.dropZone.w &&
        mouseY > this.dropZone.y &&
        mouseY < this.dropZone.y + this.dropZone.h
      ) {
        // Prevent tower from being placed on the path
        if (!this.path.isOnPath(mouseX, mouseY)) {
          this.placedTowers.push({ ...this.draggedTower, x: mouseX, y: mouseY });
        } else {
          console.log("❌ Tower cannot be placed on the path!");
        }
      }

      this.draggedTower = null;
      this.dragging = false;
    }
  }
}
