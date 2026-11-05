// gameSettings.js
// Player settings (volumes + color-blind mode), shared by the start screen and the game.
// Saved in the browser so they stick between visits.

const COLOR_BLIND_MODES = ["Off", "Protanopia", "Deuteranopia", "Tritanopia"];

// Colors for "good / bad" UI states: valid vs invalid placement, affordable vs not, health.
// Each color-blind mode swaps red/green for a pair that type of color vision can tell apart.
const UI_PALETTES = {
  Off: {
    good: [0, 160, 0], bad: [220, 0, 0],
    goodText: [255, 223, 0], badText: [255, 0, 0],
    health: [0, 255, 0], healthEmpty: [255, 0, 0],
  },
  // Reds look dark to protanopes, so "bad" is a bright yellow-orange
  Protanopia: {
    good: [0, 114, 178], bad: [230, 159, 0],
    goodText: [86, 180, 233], badText: [240, 228, 66],
    health: [86, 180, 233], healthEmpty: [230, 159, 0],
  },
  Deuteranopia: {
    good: [0, 114, 178], bad: [213, 94, 0],
    goodText: [86, 180, 233], badText: [240, 130, 50],
    health: [86, 180, 233], healthEmpty: [213, 94, 0],
  },
  // Tritanopes confuse blue/yellow, so use teal vs. magenta-red
  Tritanopia: {
    good: [0, 158, 115], bad: [204, 51, 102],
    goodText: [120, 230, 200], badText: [255, 85, 140],
    health: [0, 158, 115], healthEmpty: [204, 51, 102],
  },
};

const gameSettings = {
  master: 0.8,   // 0..1
  sfx: 0.8,
  music: 0.5,
  colorBlind: "Off",
  tutorialDone: false, // the guided tutorial is offered until it is finished or skipped

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem("mm-settings") || "{}");
      for (const key of ["master", "sfx", "music"]) {
        if (typeof saved[key] === "number") this[key] = Math.min(1, Math.max(0, saved[key]));
      }
      if (COLOR_BLIND_MODES.includes(saved.colorBlind)) this.colorBlind = saved.colorBlind;
      if (typeof saved.tutorialDone === "boolean") this.tutorialDone = saved.tutorialDone;
    } catch (e) {
      // storage unavailable (private window, blocked site data): keep defaults
    }
  },

  save() {
    try {
      localStorage.setItem("mm-settings", JSON.stringify({
        master: this.master, sfx: this.sfx, music: this.music, colorBlind: this.colorBlind,
        tutorialDone: this.tutorialDone,
      }));
    } catch (e) {
      // storage unavailable: settings still apply for this session
    }
  },

  // Current good/bad colors as [r, g, b] arrays
  colors() {
    return UI_PALETTES[this.colorBlind] || UI_PALETTES.Off;
  },
};

gameSettings.load();
