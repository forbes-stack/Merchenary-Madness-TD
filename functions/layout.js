// layout.js
// Fits the fixed-size game canvas (700x650 start screen, 1400x750 map) to the window,
// and keeps the HTML controls (buttons, sliders, select) lined up with it.
//
// The canvas keeps its real resolution and is only scaled with CSS, so all drawing
// code keeps using canvas coordinates; p5 converts mouse/touch positions for us.
// HTML controls are placed with canvasLayout.place(el, x, y, w, h, fontSize) in canvas
// coordinates and re-scaled whenever the window changes size.

// The title screen's backdrop (assets/start_wide.png, made by tools/extend_title.js) is
// the title drawing extended outward. It is scaled with the canvas and centered on it,
// so around the canvas the drawing simply continues instead of black bars.
const TITLE_BG = { w: 2600, h: 1050 };

const canvasLayout = {
  scale: 1,
  maxScale: 2,
  items: [],

  /** Put a p5 DOM element at canvas coordinates (x, y), size w x h, with font size. */
  place(el, x, y, w, h, fontSize) {
    el.parent(select('main'));
    this.items = this.items.filter(item => item.el !== el);
    const item = { el, x, y, w, h, fontSize };
    this.items.push(item);
    this.apply(item);
  },

  apply(item) {
    const s = this.scale;
    item.el.position(item.x * s, item.y * s);
    if (item.w) item.el.size(item.w * s, item.h * s);
    if (item.fontSize) item.el.style('font-size', `${item.fontSize * s}px`);
  },

  /** Scale the canvas to fit the window (keeping its shape) and re-place every control. */
  fit() {
    const cnv = document.querySelector('canvas');
    if (!cnv) return;
    this.scale = Math.min(windowWidth / width, windowHeight / height, this.maxScale);
    cnv.style.width = `${width * this.scale}px`;
    cnv.style.height = `${height * this.scale}px`;
    document.body.style.setProperty('--title-bg-size',
      `${TITLE_BG.w * this.scale}px ${TITLE_BG.h * this.scale}px`);
    for (const item of this.items) this.apply(item);
  },
};
