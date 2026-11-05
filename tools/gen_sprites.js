// Generates pixel-art sprite sheets for the special enemies, matching the style of
// the hand-drawn sheets: ~50x95 native pixels drawn at 2x, black 1px inner outlines,
// 2-3 tones per material, light streak texture on cloth, single-color drop shadow.
//
// Sheet layout (standard grid): 2 columns (walk frames) x 4 rows (down, left, right, up),
// each cell 120x200 px.
// Usage (from the repo root): node tools/gen_sprites.js assets/enemies [preview.png]
const { writePNG } = require("./png.js");
const path = require("path");

const W = 60, H = 100, S = 2;            // native cell size, scale
const CELL_W = W * S, CELL_H = H * S;
const ROWS = ["down", "left", "right", "up"];
const BLACK = [0, 0, 0];
const SHADOW = [76, 66, 63, 182];

// ---------- shapes (functions of integer pixel x,y) ----------
const E = (cx, cy, rx, ry) => (x, y) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
const R = (x0, y0, x1, y1) => (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
const P = (pts) => (x, y) => {
  const px = x + 0.5, py = y + 0.5; let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const U = (...fs) => (x, y) => fs.some(f => f(x, y));
const Dif = (a, b) => (x, y) => a(x, y) && !b(x, y);

// deterministic per-pixel noise
const hash = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// ---------- rasterizer ----------
function newBuf() { return { c: new Array(W * H).fill(null) }; }

/**
 * part: { shape, tones: [dark, base, light], outline: 'black'|'dark'|'none',
 *         shade: true (dark band on the left), pattern: 'streaks'|'plates'|'stripes'|null, seed }
 */
function drawPart(buf, part) {
  const m = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (part.shape(x, y)) m[y * W + x] = 1;
  const inM = (x, y) => x >= 0 && y >= 0 && x < W && y < H && m[y * W + x] === 1;
  const [dark, base, light] = part.tones;
  const outline = part.outline || "black";

  for (let y = 0; y < H; y++) {
    // row span for left-side shading
    let rowMin = -1;
    for (let x = 0; x < W; x++) if (inM(x, y)) { rowMin = x; break; }
    for (let x = 0; x < W; x++) {
      if (!inM(x, y)) continue;
      const edge = !inM(x - 1, y) || !inM(x + 1, y) || !inM(x, y - 1) || !inM(x, y + 1);
      let col = base;
      if (edge && outline === "black") col = BLACK;
      else if (edge && outline === "dark") col = dark;
      else {
        if (part.shade !== false && x - rowMin <= 2) col = dark;
        const seed = part.seed || 1;
        if (part.pattern === "streaks" && col === base) {
          // short horizontal light dashes, like the cloth texture on the existing sheets
          if (hash(Math.floor(x / 3), y, seed) < 0.12 && inM(x + 1, y)) col = light;
        } else if (part.pattern === "plates") {
          if (y % 7 === 0) col = dark;
          else if (y % 7 === 1 && col === base) col = light;
          else if (y % 7 === 3 && x % 6 === 2) col = dark; // rivets
        } else if (part.pattern === "stripes") {
          col = (Math.floor(x / 3) + Math.floor(y / 3)) % 2 === 0 ? base : light; // dynamite sticks
          if (x - rowMin <= 1) col = dark;
        } else if (part.pattern === "camo" && col === base) {
          if (hash(Math.floor(x / 4), Math.floor(y / 3), seed) < 0.3) col = light;
        }
      }
      buf.c[y * W + x] = col;
    }
  }
}

// single pixels / tiny details drawn without outline
function px(buf, pts, col) { for (const [x, y] of pts) if (x >= 0 && y >= 0 && x < W && y < H) buf.c[y * W + x] = col; }

function render(parts, details, shadowCx) {
  const buf = newBuf();
  for (const p of parts) drawPart(buf, p);
  if (details) details(buf);
  return { buf, shadowCx };
}

// ---------- shared body builder ----------
// opts: palette + per-character extras. dir: down|left|up, frame: 0|1
function body(o, dir, frame) {
  const parts = [];
  const skin = o.skin;
  const add = (shape, tones, extra = {}) => parts.push({ shape, tones, ...extra });
  const lift = frame === 0 ? [0, 2] : [2, 0]; // front/back view: which leg is lifted
  const swing = frame === 0 ? 1 : -1;

  if (dir === "down" || dir === "up") {
    const back = dir === "up";
    const [l0, l1] = lift;
    // tapered legs + boots (lifted leg is shorter, like a step toward the viewer)
    add(P([[20, 60], [29, 60], [28, 84 - l0], [22, 84 - l0]]), o.pants, { pattern: o.pantsPattern, seed: 3 });
    add(P([[31, 60], [40, 60], [38, 84 - l1], [32, 84 - l1]]), o.pants, { pattern: o.pantsPattern, seed: 4 });
    add(P([[21, 82 - l0], [29, 82 - l0], [30, 90 - l0], [19, 90 - l0]]), o.boots);
    add(P([[31, 82 - l1], [39, 82 - l1], [41, 90 - l1], [30, 90 - l1]]), o.boots);
    if (o.coatTails) add(P([[19, 56], [41, 56], [44, 76], [16, 76]]), o.coat, { pattern: "streaks", seed: 9 });
    // tapered torso with broad shoulders
    add(U(P([[17, 38], [43, 38], [40, 62], [20, 62]]), E(30, 39, 13, 3.5)), o.coat, { pattern: o.coatPattern || "streaks", seed: 7 });
    if (o.shirt && !back) add(P([[27, 37], [33, 37], [32, 56], [28, 56]]), o.shirt, { shade: false });
    if (o.vest && !back) {
      add(P([[17, 38], [27, 38], [27, 61], [20, 61]]), o.vest, { pattern: "streaks", seed: 11 });
      add(P([[33, 38], [43, 38], [40, 61], [33, 61]]), o.vest, { pattern: "streaks", seed: 12 });
    }
    add(R(20, 58, 40, 61), o.belt);
    // bent arms: shoulder cap, upper arm, forearm angled in toward the hips, then hands
    add(U(E(17.5, 41.5, 5, 4.5), P([[12, 41], [20, 41], [20, 51], [13, 51]]), P([[13, 50], [20, 50], [21, 59 + swing], [15, 59 + swing]])), o.sleeve, { pattern: "streaks", seed: 5 });
    add(U(E(42.5, 41.5, 5, 4.5), P([[40, 41], [48, 41], [47, 51], [40, 51]]), P([[40, 50], [47, 50], [45, 59 - swing], [39, 59 - swing]])), o.sleeve, { pattern: "streaks", seed: 6 });
    add(E(18, 61.5 + swing, 4, 3.5), skin, { outline: "dark", shade: false });
    add(E(42, 61.5 - swing, 4, 3.5), skin, { outline: "dark", shade: false });
    // neck, ears, head
    add(R(26, 31, 34, 37), skin, { outline: "dark" });
    if (o.hat !== "helmet") { // ears (hidden under a helmet)
      add(E(21, 25.5, 2.5, 3), skin, { outline: "dark", shade: false });
      add(E(39, 25.5, 2.5, 3), skin, { outline: "dark", shade: false });
    }
    add(U(E(30, 24, 9, 9.5), P([[22, 26], [38, 26], [35, 33], [25, 33]])), back ? o.hair : skin, { outline: back ? "black" : "dark" });
  } else {
    // side view, facing left
    const stride = frame === 0;
    // back arm (darker, mostly hidden behind the torso)
    add(P(stride ? [[30, 40], [36, 40], [39, 56], [34, 57]] : [[28, 40], [34, 40], [30, 57], [25, 56]]), o.sleeveDark || o.sleeve);
    // back leg + boot (toe points left)
    add(P(stride ? [[28, 60], [35, 60], [39, 83], [33, 84]] : [[27, 60], [34, 60], [33, 84], [28, 84]]), o.pants, { pattern: o.pantsPattern, seed: 13 });
    add(stride ? P([[33, 82], [40, 82], [40, 89], [30, 89]]) : P([[27, 83], [34, 83], [34, 90], [24, 90]]), o.boots);
    // front leg + boot
    add(P(stride ? [[24, 60], [31, 60], [25, 84], [19, 83]] : [[25, 60], [32, 60], [31, 85], [26, 85]]), o.pants, { pattern: o.pantsPattern, seed: 14 });
    add(stride ? P([[18, 82], [25, 82], [26, 90], [14, 90]]) : P([[25, 84], [32, 84], [32, 91], [22, 91]]), o.boots);
    if (o.coatTails) add(P([[23, 56], [37, 56], [41, 76], [23, 76]]), o.coat, { pattern: "streaks", seed: 9 });
    // torso (chest forward, back straight)
    add(U(P([[22, 39], [37, 38], [37, 62], [24, 62]]), E(30, 40, 7.5, 3.5)), o.coat, { pattern: o.coatPattern || "streaks", seed: 15 });
    if (o.vest) add(P([[22, 39], [29, 39], [29, 61], [24, 61]]), o.vest, { pattern: "streaks", seed: 16 });
    add(R(24, 58, 37, 61), o.belt);
    // front arm: shoulder cap + swinging arm + hand
    add(U(E(31, 42, 4.5, 4.5), P(stride ? [[27, 41], [34, 41], [27, 57], [21, 56]] : [[27, 41], [34, 41], [36, 56], [30, 57]])), o.sleeve, { pattern: "streaks", seed: 17 });
    add(E(stride ? 23.5 : 33.5, 59.5, 4, 3.5), skin, { outline: "dark", shade: false });
    // neck, head with nose and jaw, ear
    add(R(27, 31, 33, 37), skin, { outline: "dark" });
    add(U(E(29.5, 24, 8.5, 9.5), P([[22, 26], [21, 29], [23, 31], [33, 33], [34, 28]]), P([[22, 24], [19, 28], [22, 29]])), skin, { outline: "dark" });
    add(E(32, 25.5, 2.5, 3), skin, { outline: "dark", shade: false });
    add(P([[33, 17], [39, 18], [38, 31], [35, 30]]), o.hair, { shade: false }); // hair at the back of the head
  }
  return parts;
}

// hat helper: cowboy / wide / top / helmet
function hat(o, dir, parts) {
  const side = dir === "left";
  const cx = side ? 29 : 30;
  if (o.hat === "cowboy") {
    parts.push({ shape: U(R(cx - 7, 8, cx + 7, 17), E(cx, 9, 7, 3)), tones: o.hatTones, pattern: "streaks", seed: 21 });
    parts.push({ shape: E(cx, 18, side ? 12 : 14, 3), tones: o.hatTones, seed: 22 });
    parts.push({ shape: R(cx - 7, 15, cx + 7, 16), tones: o.bandTones, shade: false, outline: "none" });
  } else if (o.hat === "wide") {
    parts.push({ shape: U(R(cx - 6, 7, cx + 6, 17), E(cx, 8, 6, 3)), tones: o.hatTones, seed: 21 });
    parts.push({ shape: E(cx, 18, side ? 15 : 18, 3.5), tones: o.hatTones, seed: 22 });
  } else if (o.hat === "top") {
    parts.push({ shape: R(cx - 6, 1, cx + 6, 17), tones: o.hatTones, seed: 21 });
    parts.push({ shape: E(cx, 18, side ? 10 : 11, 2.5), tones: o.hatTones, seed: 22 });
    parts.push({ shape: R(cx - 6, 13, cx + 6, 15), tones: o.bandTones, shade: false, outline: "none" });
  } else if (o.hat === "helmet") {
    parts.push({ shape: U(R(cx - 9, 13, cx + 9, 33), E(cx, 14, 9, 8)), tones: o.hatTones, pattern: "plates", seed: 21 });
  }
}

// ---------- characters ----------
const C = {
  skin:   [[161, 129, 120], [210, 167, 156], [225, 190, 180]],
  black:  [[20, 18, 18], [38, 32, 30], [60, 55, 52]],
  boots:  [[38, 20, 4], [60, 32, 4], [79, 41, 3]],
  leather:[[60, 32, 4], [97, 68, 26], [130, 95, 45]],
};

const characters = {
  dynamite: {
    o: {
      skin: C.skin, hair: [[38, 20, 4], [60, 32, 4], [79, 41, 3]],
      pants: [[50, 58, 70], [70, 80, 95], [95, 105, 120]], pantsPattern: "streaks",
      boots: C.boots, sleeve: [[150, 112, 70], [190, 150, 100], [215, 180, 135]],
      coat: [[150, 112, 70], [190, 150, 100], [215, 180, 135]],
      vest: [[60, 32, 4], [76, 49, 31], [97, 68, 26]], belt: C.leather,
      hat: "cowboy", hatTones: [[80, 50, 25], [110, 70, 35], [140, 95, 50]], bandTones: [[150, 30, 25], [150, 30, 25], [150, 30, 25]],
    },
    extra(o, dir, frame, parts) {
      const red = [[120, 25, 20], [175, 40, 30], [215, 70, 50]];
      const spark = frame === 0 ? [255, 230, 60] : [255, 140, 30];
      if (dir === "down") {
        // bandolier of dynamite across the chest + bandana over the face
        parts.push({ shape: P([[19, 39], [24, 38], [42, 57], [37, 59]]), tones: red, pattern: "stripes" });
        parts.push({ shape: P([[21, 26], [39, 26], [37, 32], [30, 35], [23, 32]]), tones: red, pattern: "streaks", seed: 31 });
        // lit stick in the right hand
        parts.push({ shape: R(41, 49, 44, 62), tones: red });
        return (b) => {
          px(b, [[26, 23], [27, 23], [33, 23], [34, 23]], BLACK);
          px(b, [[44, 48], [45, 47]], [60, 50, 40]);
          px(b, [[45, 45], [46, 46], [44, 46], [45, 46], [45, 44], [47, 45], [43, 45]], spark);
        };
      }
      if (dir === "up") {
        parts.push({ shape: P([[41, 39], [36, 38], [18, 57], [23, 59]]), tones: red, pattern: "stripes" });
        parts.push({ shape: R(27, 30, 33, 33), tones: red }); // bandana knot
        return null;
      }
      // side: bandana + stick in front hand
      parts.push({ shape: P([[21, 26], [31, 26], [31, 32], [24, 34]]), tones: red, pattern: "streaks", seed: 31 });
      const hx = frame === 0 ? 23 : 33;
      parts.push({ shape: R(hx - 2, 49, hx + 1, 62), tones: red });
      return (b) => {
        px(b, [[24, 23], [25, 23]], BLACK);
        px(b, [[hx + 1, 48], [hx + 2, 47]], [60, 50, 40]);
        px(b, [[hx + 2, 45], [hx + 3, 46], [hx + 1, 46], [hx + 2, 46], [hx + 2, 44], [hx + 4, 45], [hx, 45]], spark);
      };
    },
  },

  ghost: {
    o: {
      skin: [[150, 158, 170], [200, 205, 212], [225, 228, 232]], hair: [[60, 62, 70], [85, 88, 96], [110, 112, 120]],
      pants: [[45, 47, 52], [66, 68, 74], [90, 92, 98]], pantsPattern: null,
      boots: [[30, 30, 34], [48, 48, 54], [66, 66, 72]],
      sleeve: [[165, 168, 170], [205, 207, 205], [232, 233, 228]],
      coat: [[165, 168, 170], [205, 207, 205], [232, 233, 228]], belt: [[45, 47, 52], [66, 68, 74], [90, 92, 98]],
      hat: "wide", hatTones: [[85, 88, 96], [118, 120, 128], [150, 152, 160]],
    },
    extra(o, dir, frame, parts) {
      const poncho = [[150, 154, 158], [196, 199, 198], [228, 230, 226]];
      const glow = frame === 0 ? [190, 235, 250] : [150, 210, 235];
      // tattered poncho over the torso and arms (jagged hem)
      const hemFront = [[10, 64], [14, 69], [18, 64], [22, 70], [26, 64], [30, 70], [34, 64], [38, 70], [42, 64], [46, 69], [50, 64]];
      if (dir === "down" || dir === "up") {
        parts.push({ shape: P([[16, 37], [44, 37], [50, 64], ...hemFront.slice().reverse(), [10, 64]]), tones: poncho, pattern: "streaks", seed: 41 });
        if (dir === "down") {
          // lantern in the right hand, below the poncho
          parts.push({ shape: R(39, 64, 45, 72), tones: [[60, 90, 110], [120, 170, 200], [180, 220, 240]] });
          return (b) => {
            px(b, [[26, 24], [27, 24], [26, 25], [27, 25], [33, 24], [34, 24], [33, 25], [34, 25]], BLACK); // hollow eyes
            px(b, [[29, 30], [30, 30], [31, 30]], [120, 125, 135]);
            px(b, [[41, 67], [42, 67], [43, 67], [41, 68], [42, 68], [43, 68], [42, 69]], glow);
          };
        }
        return null;
      }
      parts.push({ shape: P([[23, 37], [37, 37], [42, 64], [38, 70], [34, 64], [30, 70], [26, 64], [22, 70], [19, 64]]), tones: poncho, pattern: "streaks", seed: 41 });
      const hx = frame === 0 ? 23 : 33;
      parts.push({ shape: R(hx - 3, 65, hx + 3, 73), tones: [[60, 90, 110], [120, 170, 200], [180, 220, 240]] });
      return (b) => {
        px(b, [[24, 24], [25, 24], [24, 25], [25, 25]], BLACK);
        px(b, [[hx - 1, 68], [hx, 68], [hx + 1, 68], [hx - 1, 69], [hx, 69], [hx + 1, 69], [hx, 70]], glow);
      };
    },
  },

  doc: {
    o: {
      skin: C.skin, hair: [[90, 90, 92], [130, 130, 132], [170, 170, 172]],
      pants: [[70, 66, 62], [100, 95, 90], [125, 120, 114]], pantsPattern: "streaks",
      boots: [[20, 18, 18], [38, 32, 30], [60, 55, 52]],
      sleeve: [[28, 28, 34], [44, 44, 54], [70, 70, 82]], sleeveDark: [[20, 20, 26], [32, 32, 40], [50, 50, 60]],
      coat: [[28, 28, 34], [44, 44, 54], [70, 70, 82]], coatTails: true,
      shirt: [[190, 186, 178], [228, 224, 214], [245, 242, 235]], belt: [[28, 28, 34], [44, 44, 54], [70, 70, 82]],
      hat: "top", hatTones: C.black, bandTones: [[110, 25, 25], [110, 25, 25], [110, 25, 25]],
    },
    extra(o, dir, frame, parts) {
      const bag = [[70, 35, 15], [110, 60, 30], [145, 90, 50]];
      const swing = frame === 0 ? 1 : -1;
      if (dir === "down") {
        parts.push({ shape: R(12, 62 + swing, 24, 72 + swing), tones: bag, pattern: "streaks", seed: 51 });
        return (b) => {
          // spectacles, mustache, red tie, white cross on the bag
          px(b, [[25, 23], [26, 23], [27, 23], [32, 23], [33, 23], [34, 23], [28, 23], [31, 23], [29, 23], [30, 23]], BLACK);
          px(b, [[26, 24], [33, 24]], [200, 220, 225]);
          px(b, [[26, 28], [27, 28], [28, 28], [29, 29], [30, 29], [31, 28], [32, 28], [33, 28], [34, 28]], [80, 55, 35]);
          px(b, [[29, 38], [30, 38], [29, 39], [30, 39], [29, 40], [30, 40], [29, 41], [30, 41], [29, 42], [30, 42], [29, 43], [30, 43]], [150, 30, 30]);
          const cy = 67 + swing;
          px(b, [[18, cy - 2], [18, cy - 1], [18, cy], [18, cy + 1], [18, cy + 2], [16, cy], [17, cy], [19, cy], [20, cy]], [240, 240, 235]);
        };
      }
      if (dir === "up") return null;
      const hx = frame === 0 ? 23 : 33;
      parts.push({ shape: R(hx - 5, 60, hx + 5, 70), tones: bag, pattern: "streaks", seed: 51 });
      return (b) => {
        px(b, [[22, 23], [23, 23], [24, 23], [25, 23], [26, 23]], BLACK);
        px(b, [[23, 24]], [200, 220, 225]);
        px(b, [[22, 28], [23, 28], [24, 28], [25, 29]], [80, 55, 35]);
        px(b, [[hx, 63], [hx, 64], [hx, 65], [hx, 66], [hx, 67], [hx - 2, 65], [hx - 1, 65], [hx + 1, 65], [hx + 2, 65]], [240, 240, 235]);
      };
    },
  },

  ironclad: {
    o: {
      skin: [[90, 95, 100], [140, 145, 150], [190, 195, 200]], hair: [[90, 95, 100], [140, 145, 150], [190, 195, 200]],
      pants: [[80, 84, 90], [125, 130, 136], [170, 175, 180]], pantsPattern: "plates",
      boots: [[40, 42, 46], [62, 64, 68], [85, 88, 92]],
      sleeve: [[90, 95, 100], [140, 145, 150], [190, 195, 200]],
      coat: [[90, 95, 100], [140, 145, 150], [190, 195, 200]], coatPattern: "plates",
      belt: C.leather,
      hat: "helmet", hatTones: [[90, 95, 100], [150, 155, 160], [200, 205, 210]],
    },
    extra(o, dir, frame, parts) {
      const steel = [[90, 95, 100], [150, 155, 160], [200, 205, 210]];
      const wood = [[60, 32, 4], [97, 68, 26], [130, 95, 45]];
      if (dir === "down" || dir === "up") {
        // shoulder pauldrons
        parts.push({ shape: E(16, 41, 6, 5), tones: steel });
        parts.push({ shape: E(44, 41, 6, 5), tones: steel });
        if (dir === "down") {
          // sledgehammer in the right hand
          const sw = frame === 0 ? -1 : 1;
          parts.push({ shape: R(42, 46 + sw, 43, 70 + sw), tones: wood, shade: false });
          parts.push({ shape: R(37, 40 + sw, 48, 47 + sw), tones: [[50, 52, 56], [75, 78, 84], [110, 114, 120]] });
          return (b) => {
            for (let x = 23; x <= 37; x++) px(b, [[x, 23]], BLACK);              // visor slit
            px(b, [[27, 23], [33, 23]], [200, 60, 40]);                        // eye glints
            for (let x = 22; x <= 38; x += 4) px(b, [[x, 30]], [70, 74, 80]);  // helmet rivets
          };
        }
        return null;
      }
      parts.push({ shape: E(30, 41, 6, 5), tones: steel });
      const hx = frame === 0 ? 23 : 33;
      parts.push({ shape: R(hx, 44, hx + 1, 70), tones: wood, shade: false });
      parts.push({ shape: R(hx - 5, 38, hx + 6, 45), tones: [[50, 52, 56], [75, 78, 84], [110, 114, 120]] });
      return (b) => {
        for (let x = 20; x <= 29; x++) px(b, [[x, 23]], BLACK);
        px(b, [[23, 23]], [200, 60, 40]);
      };
    },
  },
};

function buildCell(ch, dir, frame) {
  const o = ch.o;
  const parts = body(o, dir, frame);
  const details = ch.extra(o, dir, frame, parts);
  hat(o, dir, parts);
  // helmet must not hide extras drawn on the face, so draw details last
  return render(parts, details, dir === "left" ? 31 : 33);
}

function blitCell(sheet, sheetW, cell, col, row, mirror) {
  const { buf, shadowCx } = cell;
  const ox = col * CELL_W, oy = row * CELL_H;
  const put = (X, Y, rgba) => {
    const i = (Y * sheetW + X) * 4;
    sheet[i] = rgba[0]; sheet[i + 1] = rgba[1]; sheet[i + 2] = rgba[2]; sheet[i + 3] = rgba[3];
  };
  // shadow first, opaque art on top
  const sh = E(shadowCx, 90.5, 13, 4.5);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const sx = mirror ? W - 1 - x : x;
    const c = buf.c[y * W + sx];
    let rgba = c ? [...c, 255] : (sh(sx, y) ? SHADOW : null);
    if (!rgba) continue;
    for (let dy = 0; dy < S; dy++) for (let dx = 0; dx < S; dx++) put(ox + x * S + dx, oy + y * S + dy, rgba);
  }
}

function makeSheet(ch) {
  const sw = CELL_W * 2, shh = CELL_H * 4;
  const sheet = Buffer.alloc(sw * shh * 4);
  ROWS.forEach((dir, row) => {
    for (let frame = 0; frame < 2; frame++) {
      const srcDir = dir === "right" ? "left" : dir;
      blitCell(sheet, sw, buildCell(ch, srcDir, frame), frame, row, dir === "right");
    }
  });
  return { sheet, sw, shh };
}

const outDir = process.argv[2] || ".";
const sheets = {};
for (const [name, ch] of Object.entries(characters)) {
  const s = makeSheet(ch);
  sheets[name] = s;
  writePNG(path.join(outDir, name + ".png"), s.sw, s.shh, s.sheet);
  console.log("wrote", name + ".png", s.sw + "x" + s.shh);
}

// optional preview: all sheets side by side on a sand background
if (process.argv[3]) {
  const names = Object.keys(sheets);
  const pw = (CELL_W * 2 + 20) * names.length, ph = CELL_H * 4;
  const prev = Buffer.alloc(pw * ph * 4);
  for (let i = 0; i < pw * ph; i++) { prev[i * 4] = 214; prev[i * 4 + 1] = 170; prev[i * 4 + 2] = 115; prev[i * 4 + 3] = 255; }
  names.forEach((n, k) => {
    const { sheet, sw, shh } = sheets[n];
    for (let y = 0; y < shh; y++) for (let x = 0; x < sw; x++) {
      const i = (y * sw + x) * 4, a = sheet[i + 3] / 255;
      if (!a) continue;
      const j = (y * pw + x + k * (CELL_W * 2 + 20)) * 4;
      for (let c = 0; c < 3; c++) prev[j + c] = Math.round(sheet[i + c] * a + prev[j + c] * (1 - a));
    }
  });
  writePNG(process.argv[3], pw, ph, prev);
  console.log("preview", process.argv[3]);
}
