// gridEnemy.js
// Base for enemies whose sprite sheet uses the standard grid layout:
// 2 columns (walk frames) x 4 rows (down, left, right, up), each cell 120x200 px.
// New art can be dropped in with the same layout without touching code.
class GridEnemy extends Enemy {
  static CELL_W = 120;
  static CELL_H = 200;
  static ROWS = { down: 0, left: 1, right: 2, up: 3 };

  constructor(path, speed, health, currency, sprite) {
    super(path, speed, health, currency);
    this.sprite = sprite;
    this.direction = "down"; // default starting direction
    this.frame = 0;          // which walking frame
    // on-screen size of the 120x200 cell: the figure comes out ~41 px tall,
    // the same height as the original Basic / Fast / Tank enemies
    this.drawW = 29;
    this.drawH = 48;
    this.alpha = 255;        // subclasses can draw see-through (e.g. camo)
  }

  updateDirection(target) {
    let dx = target.x - this.x;
    let dy = target.y - this.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      this.direction = dx > 0 ? "right" : "left";
    } else {
      this.direction = dy > 0 ? "down" : "up";
    }

    // Cycle frames
    this.frame = frameCount % 60;
  }

  // See-through copies of sprite sheets, made once per sheet + alpha.
  // tint() every frame costs ~165 µs per enemy; drawing a pre-faded sheet costs ~10.
  static fadedSheets = new Map();

  static fadedSheet(sprite, alpha) {
    const key = sprite;
    let byAlpha = GridEnemy.fadedSheets.get(key);
    if (!byAlpha) {
      byAlpha = {};
      GridEnemy.fadedSheets.set(key, byAlpha);
    }
    if (!byAlpha[alpha]) {
      const g = createGraphics(sprite.width, sprite.height);
      g.tint(255, alpha);
      g.image(sprite, 0, 0);
      byAlpha[alpha] = g;
    }
    return byAlpha[alpha];
  }

  drawBody() {
    if (!this.sprite) return;
    const sheet = this.alpha < 255 ? GridEnemy.fadedSheet(this.sprite, this.alpha) : this.sprite;

    // imageMode set/reset by hand: push()/pop() is slow with many enemies
    imageMode(CENTER);
    const col = this.frame < 30 ? 0 : 1;
    const row = GridEnemy.ROWS[this.direction] ?? 0;
    image(sheet, this.x, this.y, this.drawW, this.drawH,
      col * GridEnemy.CELL_W, row * GridEnemy.CELL_H, GridEnemy.CELL_W, GridEnemy.CELL_H);
    imageMode(CORNER);
  }

  update(infoTracker) {
    if (!this.alive) return;

    if (this.pathIndex < this.path.length) {
      let target = this.path[this.pathIndex];
      this.updateDirection(target);
      this.move(target);
    } else {
      infoTracker.loseHealth(10);
      this.alive = false;
    }
  }
}
