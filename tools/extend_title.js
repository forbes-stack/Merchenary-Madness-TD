// Builds assets/start_wide.png: the title-screen drawing (assets/start.png) extended
// outward so it can fill any window shape without stretching. The original drawing is
// copied pixel-for-pixel into the center; around it the sky and the four sand bands are
// continued from the drawing's own edges with gentle dune curves, and copies of the
// drawing's own clouds and cacti are scattered over the new area.
//
// Usage (from the repo root): node tools/extend_title.js
// The page uses the same sizes (see TITLE_BG in functions/layout.js).
const { readPNG, writePNG } = require("./png.js");
const path = require("path");

const W = 2600, H = 1050;          // output size
const CANVAS_W = 700, CANVAS_H = 650; // title canvas the drawing sits in
const OX = (W - CANVAS_W) / 2;     // where the canvas (and drawing) sits in the output
const OY = (H - CANVAS_H) / 2;

const src = readPNG(path.join(__dirname, "..", "assets", "start.png"));
const out = Buffer.alloc(W * H * 4);

const SKY = [122, 106, 186];
const SANDS = [[239, 228, 176], [214, 204, 158], [201, 192, 149], [194, 185, 143]];
const key = (c) => c.slice(0, 3).join(",");
const BACKGROUND = new Set([SKY, ...SANDS].map(key));

const get = (x, y) => { const i = (y * src.w + x) * 4; return [src.data[i], src.data[i + 1], src.data[i + 2], src.data[i + 3]]; };
const put = (x, y, c) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4; out[i] = c[0]; out[i + 1] = c[1]; out[i + 2] = c[2]; out[i + 3] = 255;
};

// deterministic pseudo-random numbers so the output is the same every run
let seed = 7;
const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

// ---------- 1. sand band boundaries at each edge of the drawing ----------
// Top row of each sand band in a column (ignoring cacti / clouds in the way).
function bandTops(x) {
  const tops = [];
  for (const sand of SANDS) {
    let found = -1;
    for (let y = 0; y < src.h; y++) if (key(get(x, y)) === key(sand)) { found = y; break; }
    tops.push(found);
  }
  // make them increasing (a band hidden by a cactus at the edge gets a sensible value)
  for (let k = 1; k < tops.length; k++) if (tops[k] < tops[k - 1] + 6) tops[k] = tops[k - 1] + 6;
  return tops;
}
const leftTops = bandTops(1);
const rightTops = bandTops(src.w - 2);

// Band tops in the extension: start exactly at the edge values, then drift into gentle
// rolling dunes the farther they get from the drawing.
const dunes = SANDS.map((_, k) => ({
  a1: 18 + 10 * rand(), f1: 0.004 + 0.003 * rand(), p1: 6.28 * rand(),
  a2: 8 + 6 * rand(), f2: 0.011 + 0.006 * rand(), p2: 6.28 * rand(),
}));
function topsAt(distance, edgeTops) {
  const blend = 1 - Math.exp(-distance / 90); // 0 at the drawing's edge
  const tops = edgeTops.map((t, k) => {
    const d = dunes[k];
    const wave = d.a1 * Math.sin(distance * d.f1 + d.p1) + d.a2 * Math.sin(distance * d.f2 + d.p2)
      - (d.a1 * Math.sin(d.p1) + d.a2 * Math.sin(d.p2)); // = 0 at distance 0
    return Math.round(t + blend * wave);
  });
  for (let k = 1; k < tops.length; k++) if (tops[k] < tops[k - 1] + 8) tops[k] = tops[k - 1] + 8;
  return tops;
}

// ---------- 2. fill sky + sand everywhere ----------
for (let X = 0; X < W; X++) {
  const sx = X - OX; // column in drawing coordinates
  let tops;
  if (sx < 0) tops = topsAt(-sx, leftTops);
  else if (sx >= src.w) tops = topsAt(sx - src.w + 1, rightTops);
  else tops = topsAt(0, sx < src.w / 2 ? leftTops : rightTops); // replaced by the drawing below
  for (let Y = 0; Y < H; Y++) {
    const sy = Y - OY;
    let col = SKY;
    for (let k = 0; k < SANDS.length; k++) if (sy >= tops[k]) col = SANDS[k];
    put(X, Y, col);
  }
}

// ---------- 3. the original drawing, untouched, in the center ----------
for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
  const c = get(x, y);
  if (c[3] > 0) put(OX + x, OY + y, c);
}
// the drawing is 3px short of the 650px canvas: continue its bottom row
for (let y = src.h; y < CANVAS_H; y++) for (let x = 0; x < src.w; x++) put(OX + x, OY + y, get(x, src.h - 1));

// Clouds that touch the drawing's left/right edge would end in a flat cut there.
// Give each one a rounded cap past the edge: a half-ellipse as tall as the part of the
// cloud touching the edge, each row continuing that row's edge color (keeps the shading).
function mirrorEdgeClouds(edgeX, dir) {
  let y = 0;
  while (y < src.h) {
    if (!isWhite(get(edgeX, y))) { y++; continue; }
    const top = y;
    while (y < src.h && isWhite(get(edgeX, y))) y++;
    const bottom = y - 1;
    const half = (bottom - top + 1) / 2, mid = (top + bottom) / 2;
    const reach = half * 0.9; // how far the cap sticks out at its middle
    for (let row = top; row <= bottom; row++) {
      const t = (row - mid) / half;
      const len = Math.round(reach * Math.sqrt(Math.max(0, 1 - t * t)));
      const c = get(edgeX, row);
      for (let i = 1; i <= len; i++) put(OX + edgeX + dir * i, OY + row, c);
    }
  }
}

// ---------- 4. cut the drawing's clouds and cacti into stamps ----------
function components(test, minSize) {
  const seen = new Uint8Array(src.w * src.h), found = [];
  for (let s = 0; s < src.w * src.h; s++) {
    if (seen[s] || !test(get(s % src.w, (s / src.w) | 0))) continue;
    const stack = [s]; seen[s] = 1; let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    while (stack.length) {
      const c = stack.pop(), cx = c % src.w, cy = (c / src.w) | 0; n++;
      x0 = Math.min(x0, cx); y0 = Math.min(y0, cy); x1 = Math.max(x1, cx); y1 = Math.max(y1, cy);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= src.w || ny >= src.h) continue;
        const k = ny * src.w + nx;
        if (!seen[k] && test(get(nx, ny))) { seen[k] = 1; stack.push(k); }
      }
    }
    if (n >= minSize) found.push({ x0, y0, x1, y1, n });
  }
  return found;
}
const isWhite = (c) => c[0] >= 240 && c[1] >= 240 && c[2] >= 240;
const isGreen = (c) => key(c) === "34,177,76";

// a stamp = every non-background pixel inside the box (keeps cactus dots / cloud shading)
function stamp(box, keep) {
  const px = [];
  for (let y = box.y0; y <= box.y1; y++) for (let x = box.x0; x <= box.x1; x++) {
    const c = get(x, y);
    if (keep(c)) px.push([x - box.x0, y - box.y0, c]);
  }
  return { w: box.x1 - box.x0 + 1, h: box.y1 - box.y0 + 1, px };
}
// clouds: big white shapes in the sky that don't touch the drawing's edges or the sign
const clouds = components(isWhite, 2500)
  .filter(b => b.y1 < 330 && b.x0 > 0 && b.x1 < src.w - 1)
  .map(b => stamp(b, isWhite));
const cacti = components(isGreen, 300)
  .filter(b => b.y0 > 300 && b.x0 > 0 && b.x1 < src.w - 1 && b.y1 < src.h - 1)
  .map(b => stamp({ x0: b.x0 - 1, y0: b.y0 - 1, x1: b.x1 + 1, y1: b.y1 + 1 }, (c) => !BACKGROUND.has(key(c)) && c[3] > 0));

function drawStamp(s, X, Y, flip) {
  for (const [x, y, c] of s.px) put(X + (flip ? s.w - 1 - x : x), Y + y, c);
}
const outsideDrawing = (X, w) => X + w < OX - 12 || X > OX + src.w + 12;

mirrorEdgeClouds(0, -1);         // left edge, continue leftward
mirrorEdgeClouds(src.w - 1, 1);  // right edge, continue rightward

// ---------- 5. scatter them over the new area ----------
// clouds drift across the sky band, including the area above the drawing
let placedClouds = 0;
for (let X = 40; X < W - 40; X += 230 + Math.floor(rand() * 160)) {
  const s = clouds[Math.floor(rand() * clouds.length)];
  const Y = Math.floor(OY - 170 + rand() * 360);
  const overlapsDrawing = !(X + s.w < OX - 140 || X > OX + src.w + 140 || Y + s.h < OY - 12);
  if (overlapsDrawing) continue;
  drawStamp(s, X, Y, rand() < 0.5);
  placedClouds++;
}
// cacti stand on the sand, two rows, never over the drawing
let placedCacti = 0;
for (const row of [{ y: OY + 470, gap: 150 }, { y: OY + 560, gap: 190 }]) {
  for (let X = 20 + Math.floor(rand() * 60); X < W - 60; X += row.gap + Math.floor(rand() * 120)) {
    const s = cacti[Math.floor(rand() * cacti.length)];
    if (!outsideDrawing(X, s.w)) continue;
    drawStamp(s, X, row.y + Math.floor(rand() * 40) - s.h, rand() < 0.5);
    placedCacti++;
  }
}

writePNG(path.join(__dirname, "..", "assets", "start_wide.png"), W, H, out);
console.log(`wrote assets/start_wide.png ${W}x${H}: ${clouds.length} cloud + ${cacti.length} cactus shapes found, ` +
  `${placedClouds} clouds + ${placedCacti} cacti placed; band tops left ${leftTops}, right ${rightTops}`);
