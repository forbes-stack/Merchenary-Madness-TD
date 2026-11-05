# Mercenary Madness TD: Requirements Document

## 0. General Information

**Developed by:** Hollan Moore, Cameron Petry, Sebastian James, Landon Hogge, Carter Tovar

**Purpose:** Define the concrete functionality, features, and system requirements of Mercenary Madness TD, and record how far each requirement is implemented.

**Scope:** A western-themed tower defense game. The player buys mercenary towers and places them on open ground around a fixed path. Waves of outlaws walk the path, and towers attack them automatically. The player starts each wave manually, can pause at any time, and can upgrade or sell placed towers. The game ends when the player's health reaches 0.

### Status legend

| Status | Meaning |
|---|---|
| **Done** | Implemented and working as described |
| **Partial** | Some of it is implemented, or it works differently from the requirement (details in the row) |
| **Missing** | Not implemented |
| **Dropped** | Removed by design (reason in the row) |

---

## 1. Functional Requirements

### 1.1 Screens and Game Flow

| ID | Requirement | Status | Notes |
|---|---|---|---|
| F-1.1.1 | A start screen shows the game title and a **Start** button. | Done | `pages/STARTPAGE.js` with `assets/start.png` On any window shape the title drawing fills the whole screen without stretching: `assets/start_wide.png` (made by `tools/extend_title.js`) continues the sky, dunes, clouds, and cacti past the canvas edges. Animated ambience (`functions/titleAmbience.js`): faint wind streaks and drifting dust blow across the whole window, and a tumbleweed rolls and bounces along the dunes every 8–17 seconds. It runs only on the title screen (not Settings, How to Play, or in game), never blocks clicks, and is off when the system asks for reduced motion. On page load a pulsing **"Click anywhere to ride into town"** splash shows over the animated title scene; the first click, tap, or key press (which browsers require before any sound) starts the menu music and wind and brings in the menu buttons. Skipped automatically in a desktop (Electron) build, where sound can start immediately. |
| F-1.1.2 | Pressing Start loads the game map without reloading the page. | Done | Game scripts are injected in order, then images load, then `mapSetup()` runs. Meanwhile a loading screen shows the title drawing (with its extended desert around it) and a pulsing "Loading..." banner; a load failure is shown in the same banner. The in-game backdrop switches in once the map is ready. |
| F-1.1.3 | Waves only start when the player presses **Start Wave**. | Done | The button is hidden while a wave is still spawning, while paused, and on game over. It reappears once the current wave has finished spawning, so the player may intentionally send the next wave early (no bonus for doing so). |
| F-1.1.4 | The player can pause and resume with a pause button or the **P** key. | Done | The pause overlay has **Resume**, **Restart**, **Settings**, and **Quit to Title** |
| F-1.1.5 | When health reaches 0 a **Game Over** overlay appears with a **Restart** button. | Done | Restart resets health, gold, and round and removes all towers and enemies |
| F-1.1.6 | A settings screen with volume controls. | Done | **Settings** button on the start screen and in the pause menu (the same panel; in game it has no wood wall and sits over the dimmed, frozen map, with the game's own controls (palette, tower-slot button, speed button, HUD) hidden so nothing overlaps the Settings controls; Back returns to where it was opened). Master / Sound Effects / Music sliders, color-blind mode selector, and tutorial replay. Changes apply immediately, also mid-game. Settings are saved in the browser (`localStorage`) and fall back to defaults if storage is blocked. |
| F-1.1.7 | A return-to-home screen. | Done | **Quit to Title** (with the `home.png` house icon) in the pause menu and on the Game Over screen. It reloads the page, which resets the game cleanly; settings are kept. |
| F-1.1.8 | A How to Play screen. | Done | **How to Play** button on the title screen: goal, controls, all 4 towers, and all 7 outlaws with their abilities (`pages/howToPlay.js`) Settings and How to Play fill the whole window with the wood-plank wall, extended without stretching (`assets/settings_wide.png`, made by `tools/extend_wall.js`: planks repeat at the seams between planks, floorboards continue mirrored). |

### 1.2 Map and HUD

| ID | Requirement | Status | Notes |
|---|---|---|---|
| F-1.2.1 | Enemies follow a fixed path from an entry point to an exit point. | Done | 16 waypoints in `functions/map.js`. The path is drawn into the background art, not rendered by code. |
| F-1.2.2 | A visible indicator marks where enemies enter. | Dropped | Removed by design after playtesting (the wooden "Outlaws →" signpost). The entry gate in the map art marks the start of the trail. |
| F-1.2.3 | Towers can be placed only on valid ground. | Done | Valid means inside the map area (x 0–1400, y 0–500), at least 25 px from the path, and not overlapping another tower (see footprints in 1.4.1), and not under the Pause / Start Wave / speed controls in the top-right |
| F-1.2.4 | The placement preview shows whether the spot is valid. | Done | The ghost turns red if the spot is unaffordable or breaks any placement rule (F-1.2.3). The preview and the drop use the same check. |
| F-1.2.5 | A tower selection menu that can be toggled open and closed. | Dropped | Removed by design after playtesting: collapsing only hid the icons while the bar stayed, so the palette is now always visible. |
| F-1.2.6 | Health display | Done | Green/red bar with "current / 100" |
| F-1.2.7 | Currency display | Done | "Gold: N" in the bottom-right panel |
| F-1.2.8 | Round number display | Done | Shows Round 1 before and during the first wave, and increases each time a wave is started |
| F-1.2.9 | Palette prices are colored by affordability. | Done | Yellow if affordable, red if not |
| F-1.2.10 | Hovering a palette tower shows a popup with its name and damage. | Done | Values are read from the tower classes. Only during play, not behind the pause or Game Over overlay. |

### 1.3 Economy

| ID | Requirement | Status | Notes |
|---|---|---|---|
| F-1.3.1 | The player starts with 125 gold and 100 health. | Done | |
| F-1.3.2 | Killing an enemy awards gold. | Done | See the Gold reward column in 1.5.1 |
| F-1.3.3 | Clearing a wave awards a payout. | Done | +$20 + $3 × round (round 1 = $23, round 10 = $50) once every enemy in that wave has been killed or has escaped. Overlapping waves are tracked separately. No payout after game over. |
| F-1.3.4 | An enemy reaching the end of the path costs the player health. | Done | −10 health per enemy, for every enemy type |
| F-1.3.5 | Purchases fail if the player can't afford them. | Done | Tower placement, upgrades, and tower slots are all rejected without charging |
| F-1.3.6 | Tower slots limit how many towers can be on the map. | Done | The player starts with **5 slots**. The **+1 Tower Slot** button (palette strip, right of the towers) buys one more: $10 for the first, then 50% more each time ($15, $23, $34, $51, $76, $114, ...). Any tower type can use any slot; selling a tower frees its slot; Restart resets to 5 slots and a $10 fee. The HUD shows **Towers: n / max** (red at the cap); at the cap the palette grays out and dragging shows "Tower limit reached!". |

### 1.4 Towers

#### 1.4.1 Tower stats (as implemented)

Rate is the time between shots (the game runs at 60 frames per second). Footprint is the tower's radius, used for placement spacing (two towers must be at least the sum of their footprints apart) and as the click area for selecting it. Every tower starts on **First** targeting (see F-1.4.10).

| Tower | Cost | Range | Damage | Rate | Footprint | Special |
|---|---|---|---|---|---|---|
| Cowboy (basic) | $25 | 120 px | 15 | 0.5 s | 14 px | None |
| Gatling | $45 | 100 px | 7 | 0.1 s | 20 px | Rapid fire |
| Cannon | $70 | 120 px | 30 | 1.5 s | 24 px | Splash: enemies within 90 px of the target take half damage minus 5 (10 at base; 17 / 51 / 164 at damage-upgrade levels 1 / 2 / 3). Camo (Ghost) is never hit by splash. |
| Sniper | $85 | Unlimited (min 60 px) | 75 | 3 s | 16 px | Cannot hit enemies closer than 60 px |

#### 1.4.2 Requirements

| ID | Requirement | Status | Notes |
|---|---|---|---|
| F-1.4.1 | Each tower has a purchase cost. | Done | See table |
| F-1.4.2 | Each tower has its own starting range, rate of fire, and damage. | Done | See table. The tower classes are the single source of these stats; the palette in `bottomUI/ui.js` creates towers from them. |
| F-1.4.3 | Towers are placed by dragging from the palette to the map. | Done | |
| F-1.4.4 | Clicking a placed tower selects it, shows its range, and opens its upgrade menu. | Done | The menu is a ring of four round icon buttons around the tower: ⚔ upgrade damage (top), ⏱ upgrade rate (right), ◎ targeting mode (left), $ sell (bottom). Each shows its price or state underneath (🔒 Locked / ★ MAX on the button itself), and hovering shows a short label. Near edges and corners the buttons fan out toward the middle of the map instead (half circle, quarter circle, or a straight line), so they always stay on screen, never overlap, and never sit under the top-right controls (checked at every placeable spot for all 4 towers). Clicking empty ground deselects. |
| F-1.4.5 | Each tower has two upgrade paths: **Damage** and **Rate**. | Done | Both paths have 3 levels |
| F-1.4.6 | Upgrade costs | Done | Damage: $120 / $360 / $600 (×1.5 / ×2.5 / ×3.0 damage, compounding). Rate: $100 / $200 / $500 (×0.80 / ×0.60 / ×0.50 time between shots, compounding). All towers share the same upgrade tables. |
| F-1.4.7 | Buying the first upgrade on one path locks the opposite path. | Done | A tower follows a single path for all 3 levels |
| F-1.4.8 | Towers can be sold. | Done | Refund is 50% of the total spent (purchase plus upgrades) |
| F-1.4.9 | Towers differ in size. | Done | Each tower has its own footprint (see table) for placement spacing and click area |
| F-1.4.10 | The player can choose tower targeting. | Done | The tower menu has a **Target** button that cycles **First** (furthest along the path, the default), **Near** / **Far** (closest / farthest from the tower), **Strong** / **Weak** (most / least current health). Only enemies the tower can reach are considered. |
| F-1.4.11 | Towers show visual feedback when firing. | Done | A colored tracer line and impact flash per tower type. Cannon shows its splash. |
| F-1.4.12 | Towers face the enemy they're shooting. | Done | Four-direction sprites |

### 1.5 Enemies

#### 1.5.1 Enemy stats (as implemented)

Speed is in pixels per frame.

| Enemy | Health | Speed | Gold reward | First appears |
|---|---|---|---|---|
| Basic | 100 | 1 | 3 | Round 1 |
| Tank | 500 | 0.5 | 10 | Round 2 |
| Fast | 30 | 3 | 2 | Round 4 |
| Dynamite (explosive) | 150 | 1.2 | 6 | Round 5 |
| Ghost (camo) | 80 | 1.5 | 6 | Round 8 |
| Doc (regen) | 200 | 0.8 | 8 | Round 11 |
| Ironclad (armored) | 300 | 0.7 | 12 | Round 14 |

**Economy (rebalanced after playtesting):** start with $125; towers $25–$85; upgrades: damage $120 / $360 / $600, rate $100 / $200 / $500; bounties above; wave clear $20 + $3 × round. If every enemy is killed, income per wave is about $38 (round 1), $60 (2), $82 (3), $114 (4), $208 (5), and $701 (10), so early on the player can afford roughly one new tower or upgrade per wave.

Special abilities:

- **Dynamite:** when killed by a tower, bursts into 3 Fast enemies at the spot where it died. They belong to the same wave (the wave payout waits for them) and get the same stat boosts. No split if it escapes.
- **Ghost:** camo. Only Snipers, and any tower within 150 px of a Sniper (spotter range), can target it. Cannon splash does **not** hit it; only direct hits from towers that can see it. Drawn semi-transparent.
- **Doc:** heals 10 health per second (per game step, so faster at 2×), up to its max. Heals only itself.
- **Ironclad:** only **Cannons** can hurt it, with direct hits or splash. Its armor still takes 5 off every Cannon hit, minimum 1 (direct 30 → 25, splash 10 → 5). Cowboys, Gatlings, and Snipers still target and shoot it, but their shots do nothing: a metal "clink" plays and an occasional "IMMUNE" popup shows, so Ironclads also waste other towers' fire.

The four special enemies use the standard sprite grid (`enemies/gridEnemy.js`: 2 walk frames × 4 directions, 120×200 cells). They are drawn at 29×48 px so the figures are ~41 px tall, the same height as the original three enemies (in their natural, slimmer proportions). Their sheets were generated with `tools/gen_sprites.js`.

#### 1.5.2 Wave generation (as implemented)

The formulas below use a **difficulty round** `d = round + 1`, so wave 1 uses the d = 2 recipe. This keeps the original game balance from when the first wave was labeled Round 2.


- **Basic count:** `2 + 3 × (d − 1)` through d = 5, then `17 + 10 × (d − 5)`.
- **Tank (Brute) count:** 1.5× the Tank curve, rounded up: `ceil(1.5 × curve)` where curve is `d − 2` for d = 3–5, then `3 + floor(1.5^(d − 5))`. Per HUD round: R2 2, R3 3, R4 5, R5 6, R6 8, R7 9, R8 12, R9 15, R10 21. Set by `WaveManager.BRUTE_MULTIPLIER`.
- **Fast count:** 5 at d = 5, then `5 + 15 × (d − 5)`.
- **Special enemy counts:** unlocked by the **HUD round**, one new type every 3 rounds from round 5, weakest first: Dynamite 5, Ghost 8, Doc 11, Ironclad 14. Once unlocked, each follows the Tank's curve with `k = round − unlock + 1`: `k` for k ≤ 3, then `3 + floor(1.5^(k − 3))` (1, 2, 3, 4, 5, 6, 8, 10, 14…). These numbers are a starting point for playtesting.
- **Order:** the wave is shuffled so enemy types are mixed.
- **Spawn interval:** `60 − 3 × (d − 1)` frames, never below 10 frames.
- **Scaling:** every 5 HUD rounds (starting at round 5) enemies gain another +50% health and +30% speed (speed capped at 3×, reached at round 35): rounds 1–4 normal, 5–9 +50% / +30%, 10–14 +100% / +60%, 15–19 +150% / +90%, 20–24 +200% / +120%, and so on. Dynamite's split-off Runners get the same boost. Set by `WaveManager.BOOST_EVERY` and `applyTierBoost`.

#### 1.5.3 Requirements

| ID | Requirement | Status | Notes |
|---|---|---|---|
| F-1.5.1 | Each enemy type has fixed health. | Done | See table |
| F-1.5.2 | Each enemy type has a fixed speed. | Done | See table |
| F-1.5.3 | There are multiple enemy types. | Done | 7 types |
| F-1.5.4 | Enemies show a health bar. | Done | |
| F-1.5.5 | Enemies are animated and face their direction of travel. | Done | Two-frame walk cycle, 4 directions. Every frame is aligned so the feet sit just below the enemy's position on the trail (the Bandit's down frame and the Runner's and Brute's up/down frames used to float 30–40 px above it). |
| F-1.5.6 | Special enemy: **Fast** | Done | Fast enemy type |
| F-1.5.7 | Special enemy: **Explosive** | Done | Dynamite: splits into 3 Fast enemies when killed |
| F-1.5.8 | Special enemy: **Camo** (only some towers can see it) | Done | Ghost: Snipers and towers within 150 px of a Sniper |
| F-1.5.9 | Special enemy: **Regen** (heals over time) | Done | Doc: 10 health per second |
| F-1.5.10 | Enemies with armor that reduces incoming damage (like metal balloons) | Done | Ironclad: immune to everything but Cannons (direct + splash), and −5 armor per Cannon hit, minimum 1 |
| F-1.5.11 | Waves get harder as rounds increase. | Done | See wave generation |

---

## 2. Non-Functional Requirements

### 2.1 Performance

| ID | Requirement | Status | Notes |
|---|---|---|---|
| NF-2.1.1 | Runs at 60 FPS or better on target devices. | Done | Measured on the development machine (see 2.1.1): 60 FPS even with a full round-14 wave (365 enemies) on screen, at 1× and 2×. Movement, cooldowns, and spawning are counted per frame, so on a slower device the game slows down rather than skipping. Press **F** in game for the FPS overlay. |
| NF-2.1.2 | Levels load in under 3 seconds. | Done | Title page 0.29 s; Start → playable map 0.62 s (21 scripts, 19 images), on a local server. Expect somewhat more over the internet (e.g. GitHub Pages). |
| NF-2.1.3 | Player actions respond within 100 ms. | Done | Placing a tower takes ~1 ms to handle and shows on the next frame (≤ 17 ms at 60 FPS, including the 365-enemy stress test). |
| NF-2.1.4 | Memory use stays under **100 MB**. | Done | Measured: 27–30 MB JavaScript heap in Chrome, including the round-14 stress test. |
| NF-2.1.5 | Handles 100+ entities on screen without lag. | Done | 365 enemies + 12 towers in 13 ms per frame. Enemy drawing was optimized: health bars draw straight on the canvas, sprites skip `push()`/`pop()`, and the see-through Ghost uses a pre-faded copy of its sheet instead of `tint()` every frame. |

#### 2.1.1 Performance measurements

Measured in Chrome on the development machine, 12 towers placed, by timing `redraw()` (a frame must take ≤ 16.7 ms for 60 FPS):

| Enemies on screen | Before optimizing (1×) | After (1×) | After (2×) |
|---|---|---|---|
| 20 | 8.8 ms | 7.1 ms | |
| 100 | 12.3 ms | 6.7 ms | 6.2 ms |
| 200 | 21.5 ms (~47 FPS) | 9.3 ms | |
| 365 (full round 14) | 54.4 ms (~18 FPS) | 13.0 ms | 13.6 ms |

Before optimizing, a 365-enemy frame spent 51.6 ms drawing enemies: ~46 µs per health bar (p5 `push`/`fill`/`rect`/`pop`), ~28 µs per sprite, and ~165 µs per Ghost (`tint()`). Game logic (tower targeting, movement) stays under 1 ms.

### 2.2 Usability

| ID | Requirement | Status | Notes |
|---|---|---|---|
| NF-2.2.1 | Buttons and menus are clearly labeled and sized for mouse and touch. | Done | The game scales to fit any window (up to 2×) with its buttons, sliders, and menus scaled to match (`functions/layout.js`), so there is no scrolling on laptops. The game keeps its shape, so any leftover space around it is filled with the darkened desert texture (`dusty2.jpg`) and a soft shadow frames the game. Touch: tap = click, drag = place a tower; touches on the canvas don't scroll the page or double-click. Tested with simulated touch events; still worth checking on a real tablet. |
| NF-2.2.2 | A tutorial new players can complete without outside help. | Done | Guided tutorial during round 1 (`functions/tutorial.js`): offered on the first game; steps wait for the player (place a Cowboy → Start Wave → select the tower → buy an upgrade) with a bouncing arrow and a suggested spot. Start Wave stays hidden until a tower is placed. Skippable at any step; **Settings → Tutorial → Replay** offers it again. Plus the How to Play screen (F-1.1.8). |
| NF-2.2.3 | Visual feedback when towers are placed or upgrades bought. | Done | Dust puff when a tower lands, floating cost text ("-$25" on place, "-$100" on upgrade, "+$12" on sell), gold sparkle on upgrade, 3 level pips under every tower (`functions/effects.js`), and an upgrade glow that traces each upgraded tower's own outline: red-orange on the damage path, electric blue on the rate path, brighter at each level, gently pulsing, with rising sparks at level 3. Each sprite frame's glow is pre-blurred once and cached (`Tower._sprite`, `UI.drawTowerWithAura`); live canvas blur made frames 4× slower. |
| NF-2.2.4 | Audio feedback for placing towers and buying upgrades. | Done | Place, upgrade, and sell sounds (see X-4) |

### 2.3 Accessibility

| ID | Requirement | Status | Notes |
|---|---|---|---|
| NF-2.3.1 | Color-blind mode | Done | Off / Protanopia / Deuteranopia / Tritanopia. Each swaps the red/green pairs (placement ghost, palette prices, upgrade buttons, health bar) for a pair that color vision type can tell apart (`functions/gameSettings.js`). Palette prices have a dark outline so they read on every icon. |
| NF-2.3.2 | Adjustable sound levels | Done | Master, Sound Effects, and Music volume (0–100%) |

---

## 3. Future Additions (Extensibility)

| ID | Feature | Status | Notes |
|---|---|---|---|
| X-1 | Enemies can attack towers | Missing | |
| X-2 | Towers have limited ammo the player must reload | Missing | |
| X-3 | Western background music | Done | A looping tune in A minor (oom-pah bass, galloping hoofbeats, whistled melody), synthesized live. Starts with the game, stops on Game Over, restarts on Restart. Keeps playing while paused. **Menu music** on the title / Settings / How to Play screens: a slower, lonesome tune in E minor (Em–C–G–D plucked guitar arpeggios with a bass note, plus a whistled melody every other verse); it hands off to the gameplay music when Start is pressed. |
| X-4 | More sound effects | Done | All synthesized in `functions/soundFX.js` (Web Audio, no sound files): a shot per tower (revolver, Gatling, cannon, sniper), place / upgrade / sell, enemy killed, Dynamite explosion, enemy escaped, wave start bugle, wave cleared jingle, Game Over. Repeated sounds are rate-limited so rapid fire and big waves stay listenable. Audio starts on the first click (browser autoplay rules). Title screen: a continuous **wind** loop (a low rumble and a thin whistle that swell in random gusts every ~2 s) and a rising **gust** whoosh each time a tumbleweed rolls in. Because browsers block sound until the player interacts, the menu music and wind start with the first click or key press, which the title splash asks for. |
| X-5 | Game speed control | Done | A speed button left of the Pause button cycles **1x → 2x → 3x** (`functions/SpeedButton.js`). Faster speeds run the game logic 2 or 3 times per frame, so movement, spawns, and tower fire all speed up evenly. Restart returns to 1×. 5× was dropped by design. Measured: a full round-14 wave (365 enemies) with 12 towers runs at 20 ms per frame at 3× (about 50 FPS). |
| X-6 | A shop between rounds (more revolver ammo, more cannonballs) | Missing | Depends on X-2 |
| X-7 | Curved paths for enemies | Missing | Paths are straight segments. One diagonal section uses a fixed slope in `Enemy.move()` that only works for that angle. |

---

## 4. Technical Requirements

| ID | Requirement | Status | Notes |
|---|---|---|---|
| T-1 | Built with p5.js and JavaScript | Done | p5.js 1.11.10 from the jsDelivr CDN, plain JavaScript (no build step) |
| T-2 | Developed in VS Code | Done | `.vscode/settings.json` opens `index.html` in Live Preview |
| T-3 | Runs from a web server | Done | Must be served over HTTP (Live Preview, `python -m http.server`, or GitHub Pages). Opening the file directly blocks the images. |
| T-4 | Entry point | Done | `index.html` → `pages/STARTPAGE.js` → `functions/map.js` |

---

## 5. Known Issues

1. **Unused assets:** `cowboyTower.png`, `gameover.png`.
