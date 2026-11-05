// Builds assets/backgrounds/wall_wide.png: the wood-plank wall behind the Settings and How to Play
// pages (assets/backgrounds/wall.png) extended outward so it can fill any window shape without
// stretching, the same way tools/extend_title.js extends the title drawing.
//
// The pages show the center 700x650 of the 1158x650 wall; that exact region sits in the
// center of the output (same layout as start_wide.png, so the page can size both alike).
// Around it the wall continues: sideways the planks repeat plank by plank, joining at the
// dark seams between planks (so no plank is cut in half or doubled), while the horizontal
// floorboards are mirrored instead (so the boards flow on without a hard break); upward the
// planks continue as a mirror image; downward the floor strip repeats as more floorboards.
//
// Usage (from the repo root): node tools/extend_wall.js
const { readPNG, writePNG } = require("./png.js");
const path = require("path");

const W = 2600, H = 1050;              // same size as start_wide.png (see TITLE_BG in layout.js)
const CANVAS_W = 700, CANVAS_H = 650;
const OX = (W - CANVAS_W) / 2, OY = (H - CANVAS_H) / 2;

const src = readPNG(path.join(__dirname, "..", "assets", "backgrounds", "wall.png"));
const CROP_X = (src.w - CANVAS_W) / 2;   // the pages draw the wall's center 700px
const FLOOR_TOP = 611;                   // first row below the dark seam under the planks
// Dark seams between planks near the wall's left and right ends (column-darkness minima);
// the wall between them repeats sideways, so every join lands on a seam.
const SEAM_LEFT = 20, SEAM_RIGHT = 1144;

// mirror-repeat: ... 2 1 0 | 0 1 2 ... n-1 | n-1 n-2 ...
const mirror = (v, n) => {
  const period = 2 * n;
  let m = ((v % period) + period) % period;
  return m < n ? m : period - 1 - m;
};

const out = Buffer.alloc(W * H * 4);
for (let Y = 0; Y < H; Y++) {
  let sy = Y - OY;
  if (sy < 0) sy = mirror(sy, FLOOR_TOP);                                // planks continue upward
  else if (sy >= src.h) sy = FLOOR_TOP + mirror(sy - FLOOR_TOP, src.h - FLOOR_TOP); // more floorboards
  const isFloor = sy >= FLOOR_TOP - 3; // include the dark seam above the floor
  for (let X = 0; X < W; X++) {
    const raw = X - OX + CROP_X;
    const period = SEAM_RIGHT - SEAM_LEFT;
    const sx = isFloor
      ? mirror(raw, src.w)
      : SEAM_LEFT + (((raw - SEAM_LEFT) % period) + period) % period;
    const i = (sy * src.w + sx) * 4, o = (Y * W + X) * 4;
    out[o] = src.data[i]; out[o + 1] = src.data[i + 1]; out[o + 2] = src.data[i + 2]; out[o + 3] = 255;
  }
}

writePNG(path.join(__dirname, "..", "assets", "backgrounds", "wall_wide.png"), W, H, out);
console.log(`wrote assets/backgrounds/wall_wide.png ${W}x${H} (wall ${src.w}x${src.h}, center crop x ${CROP_X}, floor from y ${FLOOR_TOP})`);
