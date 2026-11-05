// settings.js
// Settings screen: volume sliders, color-blind mode, and tutorial replay.
// Opened from the start screen and from the in-game pause menu. It is a 700x650 panel
// drawn at an origin on the current canvas (0,0 on the start screen, centered over the
// map in game); the sliders/select/buttons are DOM elements placed to match.

let settingsBg;
let settingsControls = null;  // created the first time the screen opens
let settingsLayout = [];      // [element, x, y, w, h, fontSize] in panel coordinates
let settingsOrigin = { x: 0, y: 0 };
let settingsOnBack = null;    // where Back returns to (start screen or pause menu)

const SETTINGS_W = 700;
const SETTINGS_H = 650;

function settingsPreload() {
  settingsBg = loadImage('assets/backgrounds/wall.png')
}

/**
 * Show the settings controls with the panel's top-left at (originX, originY) in
 * canvas coordinates; Back calls onBack.
 */
function openSettings(onBack, originX = 0, originY = 0) {
  settingsOnBack = onBack;
  settingsOrigin = { x: originX, y: originY };
  if (!settingsControls) createSettingsControls();
  for (const [el, x, y, w, h, fontSize] of settingsLayout) {
    canvasLayout.place(el, originX + x, originY + y, w, h, fontSize);
  }
  for (const el of settingsControls) el.show();
}

function closeSettings() {
  if (!settingsControls) return;
  for (const el of settingsControls) el.hide();
}

// Rows (y = label baseline) shared by the drawing and the DOM controls
const SETTINGS_ROWS = {
  master: 255,
  sfx: 320,
  music: 385,
  colorBlind: 450,
  tutorial: 515,
};

function createSettingsControls() {
  settingsControls = [];
  settingsLayout = [];
  const place = (el, x, y, w, h, fontSize) => settingsLayout.push([el, x, y, w, h, fontSize]);

  const makeSlider = (key, preview) => {
    const slider = createSlider(0, 100, Math.round(gameSettings[key] * 100), 1);
    place(slider, 330, SETTINGS_ROWS[key] - 22, 220, 20);
    slider.input(() => {
      gameSettings[key] = slider.value() / 100;
      gameSettings.save();
      sfx.unlock();
      sfx.applyVolumes();
    });
    // short sample when you let go, so you can hear the new level
    slider.changed(() => sfx.play(preview));
    settingsControls.push(slider);
  };

  makeSlider('master', 'revolver');
  makeSlider('sfx', 'revolver');
  makeSlider('music', 'waveCleared');

  const modeSelect = createSelect();
  for (const mode of COLOR_BLIND_MODES) modeSelect.option(mode);
  modeSelect.selected(gameSettings.colorBlind);
  place(modeSelect, 330, SETTINGS_ROWS.colorBlind - 24, 160, 32, 16);
  modeSelect.changed(() => {
    gameSettings.colorBlind = modeSelect.value();
    gameSettings.save();
  });
  settingsControls.push(modeSelect);

  // Offers the guided tutorial again at the start of the next game
  const replay = createButton(gameSettings.tutorialDone ? 'Replay' : 'Queued ✓');
  place(replay, 330, SETTINGS_ROWS.tutorial - 27, 160, 36, 18);
  replay.style('background-color', '#c97a2b');
  replay.style('color', 'white');
  replay.style('border', '2px solid #603814');
  replay.style('border-radius', '8px');
  replay.style('cursor', 'pointer');
  replay.mousePressed(() => {
    gameSettings.tutorialDone = false;
    gameSettings.save();
    replay.html('Queued ✓');
  });
  settingsControls.push(replay);

  const back = createButton('Back');
  styleButton(back);
  place(back, 270, 570, 160, 50, 28);
  back.mousePressed(() => {
    closeSettings();
    if (settingsOnBack) settingsOnBack();
  });
  settingsControls.push(back);
}

// withBackdrop: draw the wood wall behind the panels (start screen). In game the panels
// sit straight on the dimmed, paused map instead.
function settingsDraw(withBackdrop = true) {
  push()
  translate(settingsOrigin.x, settingsOrigin.y)

  // wood-wall backdrop (center crop of the 1158x650 image)
  if (withBackdrop) {
    image(settingsBg, 0, 0, SETTINGS_W, SETTINGS_H, (settingsBg.width - SETTINGS_W) / 2, 0, SETTINGS_W, SETTINGS_H)
  }

  //56,34,0
  //74,45,0
  //107,65,0
  fill(107,65,0)
  strokeWeight(5)
  stroke(74,45,0)
  rect(200,50,300,100, 10)
  rect(50,200,600,360, 10)

  fill('white')
  strokeWeight(1)
  stroke('white')
  textFont('cursive')

  textSize(50)
  text('Settings', 253,115)

  textSize(30)
  text('Master Volume:', 75, SETTINGS_ROWS.master)
  text('Sound Effects:', 75, SETTINGS_ROWS.sfx)
  text('Music:', 75, SETTINGS_ROWS.music)
  text('Color-Blind:', 75, SETTINGS_ROWS.colorBlind)
  text('Tutorial:', 75, SETTINGS_ROWS.tutorial)

  // current percentages next to the sliders
  noStroke()
  textSize(20)
  textAlign(LEFT, BASELINE)
  text(`${Math.round(gameSettings.master * 100)}%`, 565, SETTINGS_ROWS.master)
  text(`${Math.round(gameSettings.sfx * 100)}%`, 565, SETTINGS_ROWS.sfx)
  text(`${Math.round(gameSettings.music * 100)}%`, 565, SETTINGS_ROWS.music)

  // preview of the "good / bad" colors for the chosen mode
  const c = gameSettings.colors()
  textSize(14)
  textAlign(CENTER, CENTER)
  stroke(255)
  strokeWeight(2)
  fill(...c.good)
  rect(505, SETTINGS_ROWS.colorBlind - 26, 60, 30, 5)
  fill(...c.bad)
  rect(572, SETTINGS_ROWS.colorBlind - 26, 60, 30, 5)
  noStroke()
  fill(255)
  text('OK', 535, SETTINGS_ROWS.colorBlind - 11)
  text('No', 602, SETTINGS_ROWS.colorBlind - 11)
  pop()
}
