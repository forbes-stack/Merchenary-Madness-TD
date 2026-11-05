// UI.js
class UI {
  constructor(path, assets = {}) {
    this.path = path;

    // Map area where towers are allowed
    this.dropZone = { x: 0, y: 0, w: 1400, h: 500 };

    // Tower templates in the palette.
    // Stats (range/damage/rate) live in the tower classes; `create` builds one.
    this.towerTypes = [
      { type: "basic",   name: "Cowboy",         cost: 25,  create: (x, y) => new Tower(x, y, 120, 15, 0.5) },
      { type: "gatling", name: "Gatling Gunner", cost: 45,  create: (x, y) => new GatlingGunTower(x, y) },
      { type: "cannon",  name: "Cannoneer",      cost: 70,  create: (x, y) => new CannonTower(x, y) },
      { type: "sniper",  name: "Sniper",         cost: 85,  create: (x, y) => new SniperTower(x, y) },
      // add more types with their own cost...
    ];

    // One sample of each tower, used to show its real stats in the hover tooltip
    for (let def of this.towerTypes) {
      def.sample = def.create(0, 0);
    }

    // Palette tile centers
    this.paletteSlots = [
      { x: 150,  y: 620, type: "basic" },
      { x: 325, y: 620, type: "gatling" },
      { x: 500, y: 620, type: "cannon" },
      { x: 675, y: 620, type: "sniper" }
      // if you want to add another x: 850, y: 620
    ];

    this.placedTowers = [];
    this.cowboyTower = assets.cowboyTower;
    this.sniperTowerImg = assets.sniperTowerImg;
    this.cannonTowerImg = assets.cannonTowerImg;
    this.gatlingTowerImg = assets.gatlingTowerImg;

    // Drag helper (expects TowerDragger to be loaded)
    // Canvas areas covered by HTML controls (set in map.js): towers can't be placed there,
    // and tower menus avoid them
    this.reservedRects = [];

    this.dragger = new TowerDragger(this.towerTypes, this.dropZone, {cowboyTower, cannonTowerImg, sniperTowerImg, gatlingTowerImg});
    this.dragger.blockedRects = this.reservedRects;

    this.bg = assets.bg;
    this.uiBg = assets.uiBg;
    this.gattlingIcon = assets.gattlingIcon;
    this.cowboyIcon = assets.cowboyIcon;
    this.cannonIcon = assets.cannonIcon;
    this.sniperIcon = assets.sniperIcon;
    this.homeIcon = assets.homeIcon;

    // Upgrade Management
    this.upgradeManager = new UpgradeManager();
    this.selectedTower = null;

    // Store button hitboxes here for mousePressed
    this.upgradeButtons = [];

    // Restart button hitbox (used in Game Over state)
    this.restartButton = null;

    // Pause menu buttons (resume/restart)
    this.pauseButtons = [];
  }

  /**
   * Base purchase cost of a tower instance (no upgrades).
   * Uses the palette definitions and tower.towerType.
   */
  getTowerBaseCost(tower) {
    if (!tower) return 0;

    // Prefer explicit base cost if you ever set it on tower
    if (typeof tower.baseCost === "number") {
      return tower.baseCost;
    }

    const typeKey = tower.towerType || tower.type; // support both just in case
    if (!typeKey) return 0;

    const def = this.towerTypes.find(tt => tt.type === typeKey);
    if (def && typeof def.cost === "number") {
      return def.cost;
    }

    return 0;
  }

  /**
   * Total gold invested in this tower:
   * base cost + all upgrade costs on its chosen path.
   */
  getTowerTotalInvestedCost(tower) {
    if (!tower) return 0;

    const baseCost = this.getTowerBaseCost(tower);
    const typeKey = tower.towerType || tower.type;
    const path = tower.upgradePath;  // 'damage' or 'rate' or null
    const level = tower.level || 0;  // 0..3

    if (!this.upgradeManager || !this.upgradeManager.upgrades[typeKey]) {
      return baseCost;
    }

    // If no path chosen yet, no upgrades were applied
    if (path !== "damage" && path !== "rate") {
      return baseCost;
    }

    const pathUpgrades = this.upgradeManager.upgrades[typeKey][path];
    if (!pathUpgrades) return baseCost;

    let extra = 0;
    const appliedLevels = Math.min(level, pathUpgrades.length);
    for (let i = 0; i < appliedLevels; i++) {
      extra += pathUpgrades[i].cost;
    }

    return baseCost + extra;
  }

  /**
   * Sell the currently selected tower for half its total invested value.
   */
  sellSelectedTower(info) {
    if (!this.selectedTower || !info) return;

    const totalCost = this.getTowerTotalInvestedCost(this.selectedTower);
    const refund = Math.floor(totalCost / 2);

    if (refund > 0 && typeof info.addCurrency === "function") {
      info.addCurrency(refund);
    }

    // Remove tower from placedTowers
    const idx = this.placedTowers.indexOf(this.selectedTower);
    if (idx !== -1) {
      this.placedTowers.splice(idx, 1);
    }

    // Clear selection so the menu closes
    this.selectedTower = null;

    return refund;
  }

  /**
   * Tower menu: four round icon buttons in a ring around the selected tower.
   *   top = upgrade damage (⚔), right = upgrade rate (⏱),
   *   left = targeting mode (◎), bottom = sell ($).
   * Each shows its price/state underneath; hovering shows a short label.
   */
  drawUpgradeUI(info, interactive = true) {
    if (!this.selectedTower) return;

    const t = this.selectedTower;
    const options = this.upgradeManager.getUpgradeOptions(t);
    const colors = gameSettings.colors();

    // CRITICAL: Clear hitboxes before drawing new ones.
    this.upgradeButtons = [];

    const ringR = 58;   // distance from the tower to each button
    const btnR = 20;    // button radius
    const margin = { left: btnR + 2, right: width - btnR - 2, top: btnR + 2, bottom: height - btnR - 14 };
    const fits = (x, y) =>
      x >= margin.left && x <= margin.right && y >= margin.top && y <= margin.bottom &&
      // stay out from under the HTML controls (Pause / Start Wave / speed)
      !this.reservedRects.some(z =>
        x + btnR > z.x && x - btnR < z.x + z.w && y + btnR > z.y && y - btnR < z.y + z.h);

    // Buttons in order: damage, rate, target, sell. Normally a full ring around the tower.
    // Near an edge or corner it tries, in order: a half-circle fan, a wider quarter-circle
    // fan, then a straight line of buttons, each pointed toward the middle of the map and
    // rotated (in 5° steps) until every button fits on screen without overlapping another.
    const at = (angle, r) => ({ x: t.x + r * cos(radians(angle)), y: t.y + r * sin(radians(angle)) });
    const layouts = [
      () => [-90, 0, 180, 90].map(a => at(a, ringR)),               // full ring (angle ignored)
      (dir) => [-75, -25, 25, 75].map(a => at(dir + a, 62)),         // half-circle fan
      (dir) => [-45, -15, 15, 45].map(a => at(dir + a, 90)),         // quarter-circle fan
      (dir) => [52, 98, 144, 190].map(d => at(dir, d)),              // straight line
    ];
    const toCenter = degrees(Math.atan2(height / 2 - t.y, width / 2 - t.x));
    const turns = [0];
    for (let turn = 5; turn <= 180; turn += 5) turns.push(turn, -turn);

    let positions = null;
    for (const [i, layout] of layouts.entries()) {
      for (const turn of (i === 0 ? [0] : turns)) {
        const candidate = layout(toCenter + turn);
        if (candidate.every(p => fits(p.x, p.y))) { positions = candidate; break; }
      }
      if (positions) break;
    }
    // last resort: full ring squeezed onto the screen
    if (!positions) {
      positions = [-90, 0, 180, 90].map(a => at(a, ringR)).map(p => ({
        x: constrain(p.x, margin.left, margin.right),
        y: constrain(p.y, margin.top, margin.bottom),
      }));
    }
    const place = (i) => positions[i];

    // Upgrade buttons: price, or locked (other path chosen), or max level
    const upgradeButton = (type, icon, pos) => {
      const opt = options[type];
      if (opt) {
        const affordable = info.currency >= opt.cost;
        return { type, pos, icon, fill: affordable ? colors.good : colors.bad,
          caption: `$${opt.cost}`,
          hover: `Upgrade ${type === "damage" ? "damage" : "fire rate"} to Lv ${t.level + 1} ($${opt.cost})` };
      }
      if (t.isMaxLevel()) {
        return { type, pos, icon: "★", fill: [200, 160, 0], caption: "MAX", hover: "Max level reached" };
      }
      return { type, pos, icon: "🔒", fill: [90, 90, 90], caption: "Locked",
        hover: `Locked: this tower is on the ${t.upgradePath} path` };
    };

    const sellPrice = Math.floor(this.getTowerTotalInvestedCost(t) / 2);
    const buttons = [
      upgradeButton("damage", "⚔", place(0)),
      upgradeButton("rate", "⏱", place(1)),
      { type: "target", pos: place(2), icon: "◎", fill: [70, 130, 180],
        caption: t.targetMode, hover: `Target: ${t.targetMode} (click to change)` },
      { type: "sell", pos: place(3), icon: "$", fill: [150, 75, 0],
        caption: `$${sellPrice}`, hover: `Sell for $${sellPrice}` },
    ];

    let hovered = null;
    for (const b of buttons) {
      const { x, y } = b.pos;
      const isHover = interactive && dist(mouseX, mouseY, x, y) <= btnR;
      if (isHover) hovered = b;

      push();
      // button
      stroke(255);
      strokeWeight(isHover ? 3 : 2);
      fill(...b.fill);
      circle(x, y, btnR * 2);
      // icon
      noStroke();
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(18);
      text(b.icon, x, y + 1);
      // caption under the button
      textSize(12);
      textStyle(BOLD);
      stroke(0);
      strokeWeight(3);
      text(b.caption, x, y + btnR + 9);
      pop();

      // Add to hitboxes
      this.upgradeButtons.push({
        x: x - btnR, y: y - btnR, w: btnR * 2, h: btnR * 2,
        type: b.type // 'damage', 'rate', 'target' or 'sell'
      });
    }

    // Hover label in one spot above the whole ring, so it never covers a button
    if (hovered) {
      push();
      textSize(13);
      const w = textWidth(hovered.hover) + 16;
      const lx = constrain(t.x, w / 2 + 2, width - w / 2 - 2);
      const topY = Math.min(t.y, ...buttons.map(b => b.pos.y));
      const ly = topY - btnR - 16 >= 13 ? topY - btnR - 16
        : Math.max(...buttons.map(b => b.pos.y)) + btnR + 30; // no room above: show it below

      rectMode(CENTER);
      fill(60, 35, 10, 235);
      stroke(255, 223, 0);
      strokeWeight(1.5);
      rect(lx, ly, w, 22, 5);
      noStroke();
      fill(255);
      textAlign(CENTER, CENTER);
      text(hovered.hover, lx, ly + 1);
      pop();
    }
  }

  /**
   * @param interactive false while paused / game over: no hover popups
   */
  display(info, allEnemies, interactive = true) {
    // CRITICAL: Clear old button hitboxes every single frame.
    this.upgradeButtons = [];

    // deleted blank boxes and re-adjusted placement of boxes
    const boxes = [
      [100, 570],
      [275, 570],
      [450, 570],
      [625, 570],
      [800, 570],
    ];
   

    // Palette icons
    for (let slot of this.paletteSlots) {
      if (!slot) continue; // Safety Check
      const base = this.towerTypes.find(t => t.type === slot.type);
      if (!base) continue;

      push();
      noStroke();
      if (slot.type === "basic") {
        fill(100, 100, 255);
        imageMode(CENTER);
        if (this.cowboyIcon) image(this.cowboyIcon, slot.x, slot.y, 100, 100);
        else circle(slot.x, slot.y, 30);
      } else if (slot.type === "gatling") {
        fill(0, 150, 0);
        imageMode(CENTER);
        if (this.gattlingIcon) image(this.gattlingIcon, slot.x, slot.y, 100, 100);
        else circle(slot.x, slot.y, 30);
      } else if (slot.type === "cannon") {
        imageMode(CENTER);
        if (this.cannonIcon) image(this.cannonIcon, slot.x, slot.y, 100, 100);
        else {
          const r = 15;
          triangle(
            slot.x, slot.y - r * 0.8,
            slot.x - r, slot.y + r * 0.6,
            slot.x + r, slot.y + r * 0.6
          );
        }
      } else if (slot.type === "sniper") {
        fill(0, 150, 0);
        imageMode(CENTER);
        if (this.sniperIcon) image(this.sniperIcon, slot.x, slot.y, 90, 90);
        else {
          const r = 15;
          triangle(
            slot.x, slot.y - r * 0.8,
            slot.x - r, slot.y + r * 0.6,
            slot.x + r, slot.y + r * 0.6
          );
        }
      }
      pop();

      const cost = base.cost;
      let hasEnoughGold = false;
      if (info && typeof info.currency === 'number') {
        hasEnoughGold = info.currency >= cost;
      }

      push();
      textAlign(CENTER, TOP);
      textSize(16);
      textStyle(BOLD);
      stroke(0);          // dark outline so the price reads on the orange icon tiles
      strokeWeight(3);

      fill(...(hasEnoughGold ? gameSettings.colors().goodText : gameSettings.colors().badText));

      text(`$${cost}`, slot.x, slot.y + 25);
      pop();

      // At the tower cap: gray the icon out
      if (this.atTowerCap(info)) {
        push();
        rectMode(CENTER);
        noStroke();
        fill(30, 30, 30, 150);
        rect(slot.x, slot.y, 100, 100, 12);
        pop();
      }
    }

    this.drawBuySlotButton(info);

    // Placed towers: update once with the whole enemy array, then draw
    if (allEnemies && info) {
      this.updateTowers(allEnemies, info);
    }
    for (let t of this.placedTowers) {
      if (!t) continue; // Safety Check
      this.drawTowerWithAura(t); // tower sprite + upgrade glow
      this.drawLevelPips(t);
    }

    // Draw selection and upgrade UI
    if (this.selectedTower) {
      if (!this.placedTowers.includes(this.selectedTower)) {
        this.selectedTower = null;
      } else {
        this.selectedTower.drawSelection();
        this.drawUpgradeUI(info, interactive);
      }
    }

    // Dragging preview (ghost tower + range)
    this.dragger.drawPreview(info, this.path, this.placedTowers);

    // Name + damage popup for the palette tower under the mouse (not while paused)
    if (interactive) this.drawPaletteTooltip();
  }

  /**
   * Draws a tower with its upgrade aura: a glow that hugs the sprite's own outline
   * (a pre-blurred copy of its sprite, see Tower._sprite), red-orange on the
   * damage path and electric blue on the rate path. Brighter each level,
   * gently pulsing; level 3 adds sparks rising around the figure.
   */
  drawTowerWithAura(t) {
    const level = t.level || 0;
    if (level === 0 || !t.upgradePath) {
      t.draw();
      return;
    }

    const col = t.upgradePath === "damage" ? [255, 90, 30] : [60, 170, 255];
    const pulse = Math.sin(frameCount * 0.08 + t.x * 0.05);  // towers pulse out of sync
    // brighter each level (0.55 / 0.8 / 1.0), gently pulsing
    const alpha = constrain(0.3 + level * 0.25 + pulse * 0.12, 0, 1);

    // the tower draws a pre-blurred glow slice behind its sprite (Tower._sprite)
    t.glow = { color: col, alpha };
    t.draw();
    t.glow = null;

    // level 3: sparks drifting upward around the figure
    if (level >= 3) {
      push();
      noStroke();
      for (let i = 0; i < 4; i++) {
        const phase = (frameCount * 0.015 + i / 4 + t.x * 0.013) % 1;
        const sx = t.x + Math.sin(i * 2.1 + frameCount * 0.03) * 22;
        const sy = t.y + 25 - phase * 60;
        fill(255, 255, 220, 230 * (1 - phase));
        circle(sx, sy, 4);
        fill(...col, 150 * (1 - phase));
        circle(sx, sy, 8);
      }
      pop();
    }
  }

  /** True when every tower slot is in use (buy another slot to place more). */
  atTowerCap(info) {
    return !!info && this.placedTowers.length >= info.towerSlots;
  }

  // "+1 Tower Slot" button in the palette strip, right of the four towers
  buySlotButton = { x: 860, y: 620, w: 160, h: 90 };

  overBuySlotButton() {
    const b = this.buySlotButton;
    return Math.abs(mouseX - b.x) <= b.w / 2 && Math.abs(mouseY - b.y) <= b.h / 2;
  }

  drawBuySlotButton(info) {
    if (!info) return;
    const b = this.buySlotButton;
    const fee = info.nextSlotFee();
    const affordable = info.currency >= fee;

    push();
    rectMode(CENTER);
    fill(107, 65, 0, 235);
    stroke(this.atTowerCap(info) ? color(255, 223, 0) : color(56, 34, 0)); // gold rim when it's needed
    strokeWeight(this.atTowerCap(info) ? 4 : 3);
    rect(b.x, b.y, b.w, b.h, 12);

    noStroke();
    textAlign(CENTER, CENTER);
    fill(255);
    textStyle(BOLD);
    textSize(18);
    text("+1 Tower Slot", b.x, b.y - 20);

    textSize(22);
    stroke(0);
    strokeWeight(3);
    fill(...(affordable ? gameSettings.colors().goodText : gameSettings.colors().badText));
    text(`$${fee}`, b.x, b.y + 6);

    noStroke();
    fill(230);
    textStyle(NORMAL);
    textSize(13);
    text(`next one +50%`, b.x, b.y + 31);
    pop();
  }

  /** Three small pips under a tower; filled gold for each upgrade level bought. */
  drawLevelPips(t) {
    const y = t.y + 30;
    push();
    stroke(0);
    strokeWeight(1);
    for (let i = 0; i < 3; i++) {
      if (i < (t.level || 0)) fill(255, 215, 0);
      else fill(60, 60, 60, 160);
      circle(t.x - 9 + i * 9, y, 6);
    }
    pop();
  }

  /** One game step for every placed tower (aim + shoot), without drawing. */
  updateTowers(allEnemies, info) {
    this.updateCamoDetection();
    for (let t of this.placedTowers) {
      if (!t) continue; // Safety Check
      t.update(allEnemies, info);
    }
  }

  /**
   * Snipers always see camo enemies, and act as spotters: any tower within
   * SPOTTER_RANGE of a Sniper can target camo too.
   */
  updateCamoDetection() {
    const SPOTTER_RANGE = 150;
    const snipers = this.placedTowers.filter(t => t && t.towerType === "sniper");
    for (let t of this.placedTowers) {
      if (!t) continue;
      t.detectsCamo = t.towerType === "sniper" ||
        snipers.some(s => dist(s.x, s.y, t.x, t.y) <= SPOTTER_RANGE);
    }
  }

  /** Palette slot under the mouse (same radius as clicking to drag), or null. */
  getHoveredSlot() {
    for (let slot of this.paletteSlots) {
      if (slot && dist(mouseX, mouseY, slot.x, slot.y) < 58) return slot;
    }
    return null;
  }

  drawPaletteTooltip() {
    if (this.dragger.draggingTower) return;
    const slot = this.getHoveredSlot();
    if (!slot) return;
    const def = this.towerTypes.find(t => t.type === slot.type);
    if (!def) return;

    const boxW = 170;
    const boxH = 54;
    const boxX = slot.x - boxW / 2;
    const boxY = slot.y - 58 - boxH - 8; // just above the icon

    push();
    rectMode(CORNER);
    fill(60, 35, 10, 230);
    stroke(255, 223, 0);
    strokeWeight(2);
    rect(boxX, boxY, boxW, boxH, 8);

    noStroke();
    textAlign(CENTER, CENTER);
    fill(255, 223, 0);
    textSize(18);
    textStyle(BOLD);
    text(def.name, slot.x, boxY + 17);

    fill(255);
    textSize(15);
    textStyle(NORMAL);
    text(`Damage: ${def.sample.damage}`, slot.x, boxY + 38);
    pop();
  }

  /**
   * Game Over overlay with Restart button.
   */
  displayGameOver() {
    // Dim the entire screen
    push();
    fill(0, 0, 0, 180);
    noStroke();
    rect(0, 0, width, height);
    pop();

    // "GAME OVER" text
    push();
    textAlign(CENTER, CENTER);
    textSize(80);
    stroke(0);
    strokeWeight(4);
    fill(255, 0, 0);
    text("GAME OVER", width / 2, height / 2 - 80);
    pop();

    // Restart button under the text
    const btnW = 220;
    const btnH = 60;
    const btnX = width / 2 - btnW / 2;
    const btnY = height / 2 + 10;

    // Save hitbox for mousePressed
    this.restartButton = { x: btnX, y: btnY, w: btnW, h: btnH };

    push();
    rectMode(CORNER);
    fill(50, 200, 50);
    stroke(0);
    strokeWeight(3);
    rect(btnX, btnY, btnW, btnH, 12);

    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(28);
    text("Restart", btnX + btnW / 2, btnY + btnH / 2);
    pop();

    // Quit to Title under Restart
    this.quitButton = { x: btnX, y: btnY + 80, w: btnW, h: btnH };
    this.drawQuitButton(this.quitButton);
  }

  /** Brown "Quit to Title" button with the house icon (assets/icons/home.png). */
  drawQuitButton(b) {
    push();
    rectMode(CORNER);
    fill(107, 65, 0);
    stroke(0);
    strokeWeight(3);
    rect(b.x, b.y, b.w, b.h, 12);

    if (this.homeIcon) {
      imageMode(CENTER);
      image(this.homeIcon, b.x + 32, b.y + b.h / 2, 40, 40);
    }

    fill(255);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(22);
    text("Quit to Title", b.x + b.w / 2 + 18, b.y + b.h / 2);
    pop();
  }

  /**
   * Pause menu overlay with Resume + Restart buttons.
   */
  displayPauseMenu() {
    // Clear previous pause button hitboxes
    this.pauseButtons = [];

    // Dim the entire screen (a bit lighter than game over if you want)
    push();
    fill(0, 0, 0, 140);
    noStroke();
    rect(0, 0, width, height);
    pop();

    // "PAUSED" text
    push();
    textAlign(CENTER, CENTER);
    textSize(70);
    stroke(0);
    strokeWeight(4);
    fill(255);
    text("PAUSED", width / 2, height / 2 - 150);
    pop();

    const btnW = 220;
    const btnH = 60;
    const centerX = width / 2 - btnW / 2;
    const resumeY = height / 2 - 70;
    const restartY = resumeY + 80;

    // Resume button
    push();
    rectMode(CORNER);
    fill(70, 130, 180); // bluish
    stroke(0);
    strokeWeight(3);
    rect(centerX, resumeY, btnW, btnH, 12);

    fill(255);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(24);
    text("Resume", centerX + btnW / 2, resumeY + btnH / 2);
    pop();

    this.pauseButtons.push({
      x: centerX,
      y: resumeY,
      w: btnW,
      h: btnH,
      type: "resume"
    });

    // Restart button (reuse same label style as game over)
    push();
    rectMode(CORNER);
    fill(50, 200, 50);
    stroke(0);
    strokeWeight(3);
    rect(centerX, restartY, btnW, btnH, 12);

    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(24);
    text("Restart", centerX + btnW / 2, restartY + btnH / 2);
    pop();

    this.pauseButtons.push({
      x: centerX,
      y: restartY,
      w: btnW,
      h: btnH,
      type: "restart"
    });

    // Settings (volume, color-blind mode) under Restart, styled like the start screen's
    const settingsY = restartY + 80;
    push();
    rectMode(CORNER);
    fill(0, 100, 0);     // darkgreen, like the start screen buttons
    stroke(34, 139, 34); // forestgreen border
    strokeWeight(4);
    rect(centerX, settingsY, btnW, btnH, 12);
    fill(144, 238, 144);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(26);
    textFont('cursive');
    text("Settings", centerX + btnW / 2, settingsY + btnH / 2);
    pop();

    this.pauseButtons.push({ x: centerX, y: settingsY, w: btnW, h: btnH, type: "settings" });

    // Quit to Title at the bottom
    const quit = { x: centerX, y: settingsY + 80, w: btnW, h: btnH, type: "quit" };
    this.drawQuitButton(quit);
    this.pauseButtons.push(quit);
  }

  /**
   * Handle clicks when the game is over.
   * `onRestart` is a callback (like restartGame in sketch.js).
   */
  handleGameOverClick(onRestart, onQuit) {
    const hit = (b) => b &&
      mouseX > b.x && mouseX < b.x + b.w &&
      mouseY > b.y && mouseY < b.y + b.h;

    if (hit(this.restartButton) && typeof onRestart === "function") {
      onRestart();
    } else if (hit(this.quitButton) && typeof onQuit === "function") {
      onQuit();
    }
  }

  /**
   * Handle clicks when the game is paused.
   * `onResume` and `onRestart` come from sketch.js
   */
  handlePauseClick(onResume, onRestart, onQuit, onSettings) {
    if (!this.pauseButtons || this.pauseButtons.length === 0) return;

    for (let b of this.pauseButtons) {
      if (
        mouseX > b.x && mouseX < b.x + b.w &&
        mouseY > b.y && mouseY < b.y + b.h
      ) {
        if (b.type === "resume" && typeof onResume === "function") {
          onResume();
        } else if (b.type === "restart" && typeof onRestart === "function") {
          onRestart();
        } else if (b.type === "quit" && typeof onQuit === "function") {
          onQuit();
        } else if (b.type === "settings" && typeof onSettings === "function") {
          onSettings();
        }
        return;
      }
    }
  }

  mousePressed(info) {
    // 1. Check Upgrade / Sell Buttons
    if (this.selectedTower && this.upgradeButtons.length > 0) {
      for (let btn of this.upgradeButtons) {
        if (!btn) continue;
        if (mouseX > btn.x && mouseX < btn.x + btn.w &&
            mouseY > btn.y && mouseY < btn.y + btn.h) {

          const t = this.selectedTower;
          if (btn.type === 'sell') {
            const refund = this.sellSelectedTower(info);
            sfx.play('sell');
            effects.floatText(t.x, t.y, `+$${refund}`, gameSettings.colors().goodText);
          } else if (btn.type === 'target') {
            t.cycleTargetMode();
          } else {
            const option = this.upgradeManager.getUpgradeOptions(t)[btn.type];
            if (this.upgradeManager.applyUpgrade(t, btn.type, info)) {
              sfx.play('upgrade');
              effects.sparkle(t.x, t.y);
              effects.floatText(t.x, t.y, `-$${option.cost}`, gameSettings.colors().badText);
            }
          }
          return; // Click was handled
        }
      }
    }

    // 2. Buy one more tower slot
    if (this.overBuySlotButton()) {
      const fee = info.nextSlotFee();
      if (info.buySlot()) {
        sfx.play('upgrade');
        effects.floatText(this.buySlotButton.x, this.buySlotButton.y - 30, `-$${fee}`, gameSettings.colors().badText);
      }
      return;
    }

    // 3. Check Shop Palette (to start drag)
    const slot = this.getHoveredSlot();
    if (slot) {
      this.selectedTower = null; // Deselect tower to clear menu
      if (this.atTowerCap(info)) {
        effects.floatText(slot.x, slot.y - 40, "Tower limit reached!", gameSettings.colors().badText);
        return;
      }
      this.dragger.startDrag(slot.type, mouseX, mouseY);
      return;
    }

    // 4. Check Placed Towers (Select a tower)
    let clickedATower = false;
    for (let i = this.placedTowers.length - 1; i >= 0; i--) {
      let t = this.placedTowers[i];
      if (!t) continue;

      if (dist(mouseX, mouseY, t.x, t.y) < (t.radius ?? 20)) {
        this.selectedTower = t;
        clickedATower = true;
        return;
      }
    }

    // 5. Deselect (Clicked Empty Space)
    if (!this.dragger.draggingTower && !clickedATower) {
      this.selectedTower = null;
    }
  }

  mouseDragged() {
    this.dragger.updateDrag(mouseX, mouseY);
  }

  mouseMoved() {
    this.dragger.updateDrag(mouseX, mouseY);
  }

  mouseReleased(infoTracker) {
    this.dragger.endDrag(this.path, this.placedTowers, infoTracker);
  }
}
