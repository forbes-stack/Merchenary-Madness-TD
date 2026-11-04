// tutorial.js
// Guided first game, run during round 1. Each step waits for the player to do the thing:
// place a tower → start the wave → select the tower → buy an upgrade.
// Offered once (until finished or skipped); Settings → "Replay Tutorial" offers it again.

class Tutorial {
  static STEPS = ["place", "start", "select", "upgrade"];

  constructor() {
    this.step = gameSettings.tutorialDone ? null : "offer";
    this.buttons = []; // clickable areas drawn this frame
  }

  get active() {
    return this.step !== null;
  }

  // Start Wave stays hidden until the player has placed a tower
  blocksWaveStart() {
    return this.step === "offer" || this.step === "place";
  }

  finish() {
    this.step = null;
    gameSettings.tutorialDone = true;
    gameSettings.save();
  }

  // Restarting mid-tutorial goes back to the first step (towers are cleared)
  onRestart() {
    if (this.active && this.step !== "offer") this.step = "place";
  }

  /** Advance when the player has done what the current step asks. */
  update(ui, info) {
    if (this.step === "place" && ui.placedTowers.length > 0) this.step = "start";
    else if (this.step === "start" && info.round >= 1) this.step = "select";
    else if (this.step === "select" && ui.selectedTower) this.step = "upgrade";
    else if (this.step === "upgrade" && ui.placedTowers.some(t => t.level > 0)) this.step = "done";
  }

  /** Returns true if the click hit a tutorial button. */
  handleClick() {
    for (const b of this.buttons) {
      if (mouseX > b.x && mouseX < b.x + b.w && mouseY > b.y && mouseY < b.y + b.h) {
        b.onClick();
        return true;
      }
    }
    return false;
  }

  draw(ui, info) {
    this.buttons = [];
    if (!this.active) return;

    const n = Tutorial.STEPS.indexOf(this.step) + 1;
    let title = n > 0 ? `Tutorial — step ${n} of ${Tutorial.STEPS.length}` : "Tutorial";
    let message = "";

    if (this.step === "offer") {
      message = "Welcome, partner! Want a quick walkthrough of your first round?";
    } else if (this.step === "place") {
      message = "Drag a Cowboy from the bottom bar onto open ground beside the trail.";
      const slot = ui.paletteSlots[0];
      this.drawArrow(slot.x, slot.y - 55, "down");
      this.drawRing(290, 400);
    } else if (this.step === "start") {
      message = "Nice shot! Now press Start Wave to send in the outlaws.";
      this.drawArrow(width - 145, 84, "up");
    } else if (this.step === "select") {
      message = "Click your tower to open its menu.";
      const t = ui.placedTowers[0];
      if (t) this.drawArrow(t.x, t.y - 30, "down");
    } else if (this.step === "upgrade") {
      message = "Buy an upgrade from the menu. Buying one path locks the other. Short on gold? Take out some outlaws first.";
      // point at an upgrade the player can afford, if there is one
      const options = ui.selectedTower ? ui.upgradeManager.getUpgradeOptions(ui.selectedTower) : {};
      const affordable = ["rate", "damage"].find(type => options[type] && options[type].cost <= info.currency);
      const b = ui.upgradeButtons.find(btn => btn.type === affordable) ||
        ui.upgradeButtons.find(btn => btn.type === "damage" || btn.type === "rate");
      if (b) this.drawArrow(b.x - 4, b.y + b.h / 2, "right");
      else if (ui.placedTowers[0]) this.drawArrow(ui.placedTowers[0].x, ui.placedTowers[0].y - 30, "down");
    } else if (this.step === "done") {
      title = "Tutorial complete";
      message = "You're ready! Hold the town as long as you can. See How to Play on the title screen for every tower and outlaw.";
    }

    // Panel along the top of the map
    const px = 300, py = 15, pw = 560, ph = 125;
    push();
    rectMode(CORNER);
    fill(60, 35, 10, 235);
    stroke(255, 223, 0);
    strokeWeight(3);
    rect(px, py, pw, ph, 10);

    noStroke();
    fill(255, 223, 0);
    textAlign(LEFT, TOP);
    textSize(15);
    textStyle(BOLD);
    text(title, px + 14, py + 10);

    fill(255);
    textStyle(NORMAL);
    textSize(17);
    text(message, px + 14, py + 32, pw - 28, 60);
    pop();

    // Buttons
    if (this.step === "offer") {
      this.drawButton(px + pw - 250, py + ph - 38, 110, 30, "Show me", () => { this.step = "place"; });
      this.drawButton(px + pw - 128, py + ph - 38, 110, 30, "Skip", () => this.finish());
    } else if (this.step === "done") {
      this.drawButton(px + pw - 128, py + ph - 38, 110, 30, "Got it!", () => this.finish());
    } else {
      this.drawButton(px + pw - 148, py + ph - 38, 130, 30, "Skip tutorial", () => this.finish());
    }
  }

  drawButton(x, y, w, h, label, onClick) {
    push();
    rectMode(CORNER);
    fill(201, 122, 43);
    stroke(96, 56, 20);
    strokeWeight(2);
    rect(x, y, w, h, 6);
    noStroke();
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(15);
    text(label, x + w / 2, y + h / 2);
    pop();
    this.buttons.push({ x, y, w, h, onClick });
  }

  // Bouncing gold arrow whose tip is at (x, y)
  drawArrow(x, y, dir) {
    const bob = Math.sin(frameCount * 0.15) * 6;
    push();
    translate(x, y);
    if (dir === "up") rotate(PI);
    else if (dir === "right") rotate(-HALF_PI);
    translate(0, -bob);
    fill(255, 215, 0);
    stroke(0);
    strokeWeight(2);
    // shaft + head, pointing down at the origin
    beginShape();
    vertex(-6, -42); vertex(6, -42); vertex(6, -18); vertex(16, -18);
    vertex(0, 0);
    vertex(-16, -18); vertex(-6, -18);
    endShape(CLOSE);
    pop();
  }

  // Pulsing ring marking a suggested spot
  drawRing(x, y) {
    const pulse = 40 + Math.sin(frameCount * 0.1) * 6;
    push();
    noFill();
    stroke(255, 215, 0, 200);
    strokeWeight(3);
    circle(x, y, pulse);
    pop();
  }
}
