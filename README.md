# Mercenary Madness TD

**Mercenary Madness** is a Wild West tower defense game that runs in your browser. Outlaws march through a frontier town, and you hire mercenaries to stop them before they get through. Place your gunslingers along the trail, upgrade them as the waves get tougher, and hold out as long as you can.

Built with [p5.js](https://p5js.org/) and plain JavaScript.

---

## How to Play

1. Press **Start** on the title screen.
2. **Drag** a mercenary from the bottom bar onto open ground. You can't place them on the trail or on top of each other. The preview turns red when you can't place there or can't afford it.
3. Press **Start Wave** to send in the outlaws. Your mercenaries fire automatically at enemies in range.
4. Earn gold by taking out outlaws, plus a bonus each time you clear a wave ($20 + $3 per round).
5. **Click** a placed mercenary to see its range, upgrade it, or sell it.
6. Every outlaw that reaches the end of the trail costs you 10 health. Hit 0 and it's **Game Over**.

### Controls

| Action | Input |
|---|---|
| Buy and place a tower | Drag from the bottom bar onto the map |
| Select, upgrade, or sell a tower | Click the tower |
| Start the next wave | **Start Wave** button |
| Pause / resume | **⏸** button or the **P** key |
| Game speed | **1x / 2x / 3x** button (click to cycle) |
| Change a tower's target | **Target** button in the tower's menu (First, Near, Far, Strong, Weak) |
| Performance overlay | **F** key |
| Restart or Quit to Title | From the pause menu or the Game Over screen |

You start with **125 gold**, **100 health**, and room for **5 towers**. Need more? The **+1 Tower Slot** button in the bottom bar buys another slot: $10 for the first, then 50% more each time. Selling a tower frees its slot.

New to the game? A short guided tutorial runs during your first round, and **How to Play** on the title screen covers every tower and outlaw.

**Settings** (on the title screen, or in the pause menu mid-game) has volume sliders for master, sound effects, and music, plus a color-blind mode (Protanopia, Deuteranopia, Tritanopia). Your choices are remembered in your browser.

---

## Mercenaries

| Tower | Cost | Role |
|---|---|---|
| **Cowboy** | $25 | Reliable all-rounder with medium range and steady damage. |
| **Gatling Gunner** | $45 | Very fast fire with low damage per shot. Shreds groups of weak enemies. |
| **Cannoneer** | $70 | Slow, heavy shots that splash damage onto nearby enemies. |
| **Sniper** | $85 | Hits anywhere on the map for big damage, targeting the outlaw closest to escaping. Can't hit enemies right next to it. |

### Upgrades

Each mercenary has two upgrade paths with three levels each:

- **Damage:** hits harder ($60 → $180 → $300)
- **Rate:** fires faster ($50 → $100 → $250)

Click a placed tower to open its menu: a ring of buttons around it for ⚔ damage, ⏱ rate, ◎ targeting, and $ sell. Hover a button to see what it does.

Choose carefully: buying one path locks the other. Upgraded mercenaries glow around their outline: fiery red-orange for damage, electric blue for fire rate, brighter with each level.
Selling a tower refunds **half** of everything you spent on it.

---

## Outlaws

| Enemy | Health | Speed | Bounty | Shows up |
|---|---|---|---|---|
| **Bandit** | Medium | Normal | 3 gold | From the first wave |
| **Brute** | Very high | Slow | 10 gold | Round 2 |
| **Runner** | Low | Very fast | 2 gold | Round 4 |
| **Dynamite** | Medium | Normal | 6 gold | Round 5 |
| **Ghost** | Low | Fast | 6 gold | Round 8 |
| **Doc** | High | Slow | 8 gold | Round 11 |
| **Ironclad** | Very high | Slow | 12 gold | Round 14 |

**Special outlaws:**

- **Dynamite** blows apart into 3 Runners when you take him out.
- **Ghost** is camouflaged. Only Snipers can see him, and so can any tower placed near a Sniper. Cannon splash passes right through him, so you need towers that can see him.
- **Doc** patches himself up as he walks, so damage that doesn't finish him off wears away.
- **Ironclad** wears plate armor that bullets just clink off. **Only Cannons can hurt him** (direct hits and splash), and even those lose 5 damage to the armor. Other towers will waste their shots on him.

Waves grow bigger and spawn faster each round, and every 5 rounds (5, 10, 15, ...) all outlaws get tougher and quicker: +50% health and +30% speed each time.

---

## Running the Game

### Play online

The game is a static site, so GitHub Pages can host it without a build step:

1. On GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, then select `main` and `/ (root)`.
3. The game will be live at `https://forbes-stack.github.io/Merchenary-Madness-TD/`, and every push to `main` updates it.

Free GitHub Pages requires a public repository (private repos need GitHub Pro).

### Run locally

The game has to be served over HTTP. Double-clicking `index.html` opens it as `file://`, and the browser blocks the images from loading.

- **Terminal (Node.js):** from the repo folder, run `node tools/serve.js` and open `http://localhost:8000/`, or
- **VS Code:** open the folder and use Live Preview (it opens `index.html`), or
- **Python:** from the repo folder, run `python -m http.server 8000` and open `http://localhost:8000/`.

The game scales to fit the browser window and works with touch (tap and drag) on tablets.

---

## Project Structure

```
index.html            Entry point (loads p5.js and the start screen)
style.css             Page layout
pages/STARTPAGE.js    Title screen; loads the game when Start is pressed
pages/settings.js     Settings screen: volume sliders, color-blind mode, replay tutorial
pages/howToPlay.js    How to Play screen
functions/tutorial.js Guided first-round tutorial
functions/effects.js  Dust, floating cost text, upgrade sparkles
functions/gameSettings.js  Saved player settings and the color-blind palettes
functions/soundFX.js  Synthesized sound effects and music (Web Audio)
functions/map.js      Main game loop: setup, drawing, input, pause, and restart
functions/            Path, wave generation, tower dragging, upgrades
towers/               Tower base class and the Gatling, Cannon, and Sniper towers
enemies/              Enemy base classes (enemy.js, gridEnemy.js) and all 7 enemies
bottomUI/             Tower palette and upgrade menu (ui.js), plus the gold/health/round HUD (infoTracker.js)
assets/               Sprites and backgrounds
tools/gen_sprites.js  Generates the special-enemy sprite sheets (node tools/gen_sprites.js assets)
tools/serve.js        Tiny local web server for playing/testing (node tools/serve.js [port])
functions/layout.js   Scales the game to fit the window
PRD.md                Requirements, implementation status, and known issues
```

See [PRD.md](PRD.md) for the full feature list, exact stats, and what's still on the roadmap.

---

## Team

Built by **Hollan Moore, Cameron Petry, Sebastian James, Landon Hogge, and Carter Tovar**.
