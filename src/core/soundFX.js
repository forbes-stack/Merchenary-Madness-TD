// soundFX.js
// All game audio is synthesized in code with the Web Audio API (no sound files).
// Volumes come from gameSettings: master × (sfx | music).
//
// Usage: sfx.play("revolver"), sfx.startMusic(), sfx.stopMusic()
// Browsers only allow audio after a click, so sfx.unlock() is called from the Start button.

class SoundFX {
  // Minimum milliseconds between two plays of the same sound, so rapid fire
  // (Gatling, 2x speed, big waves) doesn't stack into noise
  static MIN_GAP = {
    revolver: 60, gatling: 70, cannon: 90, sniper: 90,
    kill: 50, escape: 120, explode: 120, clink: 90,
  };

  constructor() {
    this.ctx = null;
    this.lastPlayed = {};
    this.music = null;          // running in-game tune, see startMusic()
    this.menuMusic = null;      // running menu tune, see startMenuMusic()
    this.wind = null;           // running wind nodes, see startWind()
    // Wanted-but-not-yet-allowed sounds: menu music and wind are asked for as soon as the
    // title screen shows, but browsers only allow audio after a click or key press.
    this.wantMenuMusic = false;
    this.wantWind = false;
  }

  // ---------- setup ----------

  _ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null; // no Web Audio: the game just runs silently
      this.ctx = new AC();
      this.masterBus = this.ctx.createGain();
      this.sfxBus = this.ctx.createGain();
      this.musicBus = this.ctx.createGain();
      this.sfxBus.connect(this.masterBus);
      this.musicBus.connect(this.masterBus);
      this.masterBus.connect(this.ctx.destination);

      // one second of white noise, reused by every noise-based sound
      const len = this.ctx.sampleRate;
      this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

      this.applyVolumes();
    }
    return this.ctx;
  }

  /** Call from a click handler: creates/resumes the audio context. */
  unlock() {
    const ctx = this._ensure();
    if (!ctx) return;
    const startWanted = () => {
      if (this.wantMenuMusic) this.startMenuMusic();
      if (this.wantWind) this.startWind();
    };
    if (ctx.state === "suspended") ctx.resume().then(startWanted);
    else startWanted();
  }

  /** Re-read volumes from gameSettings (called when a slider moves). */
  applyVolumes() {
    if (!this.ctx) return;
    this.masterBus.gain.value = gameSettings.master;
    this.sfxBus.gain.value = gameSettings.sfx;
    this.musicBus.gain.value = gameSettings.music;
  }

  // ---------- building blocks ----------

  // Oscillator with a pitch sweep from f0 to f1 and a fast-attack, exponential-decay envelope
  _tone(t, { type = "sine", f0, f1 = f0, dur, gain, bus = this.sfxBus, vibrato = 0 }) {
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
    if (vibrato) {
      const lfo = this.ctx.createOscillator();
      const depth = this.ctx.createGain();
      lfo.frequency.value = 5.5;
      depth.gain.value = vibrato;
      lfo.connect(depth).connect(osc.frequency);
      lfo.start(t);
      lfo.stop(t + dur + 0.05);
    }
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(amp).connect(bus);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  // Filtered noise burst (gunshots, explosions, hoofbeats)
  _noise(t, { filter = "lowpass", freq, q = 1, dur, gain, bus = this.sfxBus }) {
    const src = this.ctx.createBufferSource();
    const flt = this.ctx.createBiquadFilter();
    const amp = this.ctx.createGain();
    src.buffer = this.noiseBuffer;
    flt.type = filter;
    flt.frequency.value = freq;
    flt.Q.value = q;
    amp.gain.setValueAtTime(gain, t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(flt).connect(amp).connect(bus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  // A short run of notes (frequencies in Hz), each `step` seconds apart
  _notes(t, freqs, { type = "triangle", step, dur, gain, lastDur = dur }) {
    freqs.forEach((f, i) => {
      const last = i === freqs.length - 1;
      this._tone(t + i * step, { type, f0: f, dur: last ? lastDur : dur, gain });
    });
  }

  // ---------- sound effects ----------

  play(name) {
    const ctx = this._ensure();
    if (!ctx || ctx.state !== "running") return;

    const now = performance.now();
    const gap = SoundFX.MIN_GAP[name] || 0;
    if (now - (this.lastPlayed[name] || -Infinity) < gap) return;
    this.lastPlayed[name] = now;

    const t = ctx.currentTime;
    switch (name) {
      // tower shots
      case "revolver":
        this._noise(t, { filter: "bandpass", freq: 1800, dur: 0.15, gain: 0.5 });
        this._tone(t, { f0: 160, f1: 60, dur: 0.1, gain: 0.35 });
        break;
      case "gatling":
        this._noise(t, { filter: "highpass", freq: 2500, dur: 0.05, gain: 0.25 });
        break;
      case "cannon":
        this._tone(t, { f0: 110, f1: 35, dur: 0.6, gain: 0.8 });
        this._noise(t, { filter: "lowpass", freq: 600, dur: 0.5, gain: 0.6 });
        break;
      case "sniper":
        this._noise(t, { filter: "highpass", freq: 3000, dur: 0.07, gain: 0.6 });
        this._tone(t, { type: "square", f0: 900, f1: 200, dur: 0.06, gain: 0.12 });
        this._noise(t + 0.18, { filter: "bandpass", freq: 1200, dur: 0.25, gain: 0.12 }); // echo
        break;

      // placing / upgrading / selling
      case "place":
        this._tone(t, { type: "triangle", f0: 220, f1: 110, dur: 0.12, gain: 0.5 });
        this._noise(t, { filter: "lowpass", freq: 900, dur: 0.05, gain: 0.3 });
        break;
      case "upgrade":
        this._notes(t, [523, 659, 784], { step: 0.07, dur: 0.12, gain: 0.3 });
        break;
      case "sell":
        this._notes(t, [1318, 1760], { step: 0.08, dur: 0.12, gain: 0.25, lastDur: 0.25 });
        break;

      // enemy events
      case "kill":
        this._tone(t, { type: "triangle", f0: 300, f1: 120, dur: 0.12, gain: 0.2 });
        break;
      case "explode":
        this._noise(t, { filter: "lowpass", freq: 900, dur: 0.7, gain: 0.8 });
        this._tone(t, { f0: 90, f1: 30, dur: 0.7, gain: 0.8 });
        break;
      case "clink": // bullet bouncing off Ironclad armor (two inharmonic metal tones)
        this._tone(t, { type: "triangle", f0: 2400, f1: 2100, dur: 0.09, gain: 0.12 });
        this._tone(t, { type: "sine", f0: 3550, f1: 3300, dur: 0.06, gain: 0.08 });
        break;
      case "gust": { // a gust of wind blowing a tumbleweed in: swelling, rising whoosh
        const src = this.ctx.createBufferSource();
        const flt = this.ctx.createBiquadFilter();
        const amp = this.ctx.createGain();
        src.buffer = this.noiseBuffer;
        src.loop = true;
        flt.type = "bandpass";
        flt.Q.value = 1.2;
        flt.frequency.setValueAtTime(300, t);
        flt.frequency.exponentialRampToValueAtTime(1100, t + 0.9);
        flt.frequency.exponentialRampToValueAtTime(500, t + 1.8);
        amp.gain.setValueAtTime(0.0001, t);
        amp.gain.exponentialRampToValueAtTime(0.35, t + 0.7);
        amp.gain.exponentialRampToValueAtTime(0.0001, t + 1.9);
        src.connect(flt).connect(amp).connect(this.sfxBus);
        src.start(t);
        src.stop(t + 2);
        break;
      }
      case "escape":
        this._tone(t, { type: "square", f0: 440, f1: 220, dur: 0.3, gain: 0.15 });
        break;

      // waves + game state
      case "waveStart": // bugle call
        this._notes(t, [392, 523, 659, 784], { type: "square", step: 0.13, dur: 0.12, gain: 0.12, lastDur: 0.4 });
        break;
      case "waveCleared":
        this._notes(t, [523, 659, 784, 1047], { step: 0.09, dur: 0.1, gain: 0.3, lastDur: 0.35 });
        break;
      case "gameOver":
        this._notes(t, [392, 370, 349, 330], { type: "sawtooth", step: 0.35, dur: 0.33, gain: 0.12, lastDur: 1.0 });
        break;
    }
  }

  // ---------- music: desert western ambience ----------
  // Both tunes are played by the same little desert band, in E minor with the classic
  // Western turn to B7:
  //  - twangy guitar: plucked strings made with the Karplus-Strong method (a burst of noise
  //    fed around a tuned, slowly fading loop), with a slow tremolo on the guitar
  //  - a big canyon reverb and a long spaghetti-western echo on everything
  //  - a low, dusty drone under each chord that swells in and fades out
  //  - a sparse, lonesome lead line with string bends
  // The menu tune is slow and spacious. The in-game tune is the same band a bit faster,
  // with rolling guitar, a heartbeat drum and a shaker underneath to keep the tension up.

  // Chord progression: 2 bars (16 eighth notes) per chord. bass = drone/low string (Hz),
  // notes = the four guitar strings picked in the arpeggio, low to high.
  static CHORDS = [
    { bass: 82.41, notes: [123.47, 164.81, 196.0, 246.94] },  // Em
    { bass: 65.41, notes: [130.81, 196.0, 261.63, 329.63] },  // C
    { bass: 110.0, notes: [164.81, 220.0, 261.63, 329.63] },  // Am
    { bass: 61.74, notes: [155.56, 220.0, 246.94, 369.99] },  // B7
    { bass: 82.41, notes: [123.47, 164.81, 196.0, 246.94] },  // Em
    { bass: 73.42, notes: [146.83, 220.0, 293.66, 369.99] },  // D
    { bass: 65.41, notes: [130.81, 196.0, 261.63, 329.63] },  // C
    { bass: 61.74, notes: [155.56, 220.0, 246.94, 369.99] },  // B7 (leads back to Em)
  ];

  // Lead line: per chord, [eighth-note step within the chord, Hz, bend in semitones]
  static MELODY = [
    [[2, 493.88, 1], [8, 440.0], [10, 392.0], [12, 329.63]],  // Em
    [[4, 392.0], [6, 440.0], [8, 493.88, 2]],                 // C
    [[2, 523.25], [6, 493.88], [8, 440.0], [12, 329.63]],     // Am
    [[0, 369.99], [6, 440.0], [8, 493.88, 1]],                // B7
    [[2, 659.26, 2], [8, 587.33], [10, 493.88]],              // Em
    [[0, 440.0], [4, 369.99], [8, 587.33], [12, 440.0]],      // D
    [[2, 392.0], [6, 329.63], [10, 392.0], [12, 440.0]],      // C
    [[0, 493.88, 1], [8, 311.13], [12, 369.99]],              // B7
  ];

  // Reverb + echo shared by both tunes, built once, feeding the music bus.
  _musicFX() {
    if (this.musicIn) return this.musicIn;
    const ctx = this.ctx;
    this.musicIn = ctx.createGain();

    // reverb: a long, darkening tail of stereo noise (a big empty canyon)
    const len = Math.floor(ctx.sampleRate * 3);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const k = i / len;
        lp += ((Math.random() * 2 - 1) - lp) * (0.9 - 0.75 * k); // tail gets duller as it fades
        d[i] = lp * Math.pow(1 - k, 3);
      }
    }
    const verb = ctx.createConvolver();
    verb.buffer = ir;
    const wet = ctx.createGain();
    wet.gain.value = 0.6;

    // echo: repeats that get darker each time round
    const delay = ctx.createDelay(2);
    delay.delayTime.value = 0.54;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.4;
    const dull = ctx.createBiquadFilter();
    dull.type = "lowpass";
    dull.frequency.value = 1600;
    const echo = ctx.createGain();
    echo.gain.value = 0.3;

    // a gentle compressor at the end keeps stacked notes from spiking
    const glue = ctx.createDynamicsCompressor();
    glue.threshold.value = -16;
    glue.knee.value = 10;
    glue.ratio.value = 4;
    glue.attack.value = 0.005;
    glue.release.value = 0.25;
    glue.connect(this.musicBus);

    const dry = ctx.createGain();
    dry.gain.value = 0.75;
    this.musicIn.connect(dry).connect(glue);
    this.musicIn.connect(verb).connect(wet).connect(glue);
    this.musicIn.connect(delay);
    delay.connect(dull).connect(feedback).connect(delay);
    dull.connect(echo);
    echo.connect(glue);
    echo.connect(verb); // the echoes ring out in the canyon too
    return this.musicIn;
  }

  // One plucked string (Karplus-Strong), rendered once per pitch and cached.
  // bright 0..1: how much "twang" (high end) the pick puts into the string.
  _pluckBuffer(f, bright) {
    this.plucks = this.plucks || {};
    const key = `${f}|${bright}`;
    if (this.plucks[key]) return this.plucks[key];
    const sr = this.ctx.sampleRate, n = Math.floor(sr * 3);
    const buf = this.ctx.createBuffer(1, n, sr);
    const y = buf.getChannelData(0);
    const period = sr / f;
    const P = Math.ceil(period) + 2;

    // the pick: a short burst of noise, softened by `bright`, centered and normalized
    let lp = 0, mean = 0, peak = 0;
    for (let i = 0; i < P; i++) { lp += ((Math.random() * 2 - 1) - lp) * bright; y[i] = lp; mean += lp; }
    mean /= P;
    for (let i = 0; i < P; i++) { y[i] -= mean; peak = Math.max(peak, Math.abs(y[i])); }
    for (let i = 0; i < P; i++) y[i] /= peak || 1;

    // the string: average two neighbouring samples one period back (tuned exactly by
    // reading between samples), losing a little each trip, so it rings and mellows out
    const ring = f < 200 ? 2.8 : 1.8;                   // seconds to fade by 60 dB
    const g = Math.pow(0.001, 1 / (ring * f));
    const at = (pos) => { const k = Math.floor(pos), fr = pos - k; return y[k] * (1 - fr) + y[k + 1] * fr; };
    for (let i = P; i < n; i++) y[i] = g * 0.5 * (at(i - period + 0.5) + at(i - period - 0.5));

    const fade = Math.floor(sr * 0.1);                  // no click at the very end
    for (let i = 0; i < fade; i++) y[n - 1 - i] *= i / fade;
    this.plucks[key] = buf;
    return buf;
  }

  // Play a plucked note into `dest`. bend: start this many semitones flat and slide up.
  _pluck(t, f, dest, { gain = 0.2, bright = 0.4, bend = 0, dur = 3, pan = 0 } = {}) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this._pluckBuffer(f, bright);
    if (bend) {
      src.playbackRate.setValueAtTime(Math.pow(2, -bend / 12), t);
      src.playbackRate.setValueAtTime(Math.pow(2, -bend / 12), t + 0.06);
      src.playbackRate.linearRampToValueAtTime(1, t + 0.06 + 0.12 * bend);
    } else {
      src.playbackRate.setValueAtTime(1.004, t);        // a freshly picked string starts a hair sharp
      src.playbackRate.linearRampToValueAtTime(1, t + 0.06);
    }
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(gain, t);
    amp.gain.setTargetAtTime(0.0001, t + dur * 0.7, dur * 0.12); // damp the string
    src.connect(amp);
    if (pan && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      amp.connect(p).connect(dest);
    } else amp.connect(dest);
    src.start(t);
    src.stop(t + Math.min(3, dur * 1.3));
  }

  // A low, dusty drone under one chord: detuned saws + a fifth through a slowly
  // opening and closing filter, swelling in and fading out (overlaps the next chord).
  _drone(t, bass, len, dest, gain) {
    const ctx = this.ctx;
    const flt = ctx.createBiquadFilter();
    flt.type = "lowpass";
    flt.Q.value = 0.8;
    flt.frequency.setValueAtTime(220, t);
    flt.frequency.linearRampToValueAtTime(520, t + len * 0.6);
    flt.frequency.linearRampToValueAtTime(220, t + len + 3);
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(gain, t + Math.min(3, len * 0.4));
    amp.gain.setValueAtTime(gain, t + len);
    amp.gain.linearRampToValueAtTime(0, t + len + 3);
    flt.connect(amp).connect(dest);
    for (const [type, mult, level] of [["sawtooth", 1, 1], ["sawtooth", 1.004, 0.8], ["triangle", 1.5, 0.7], ["sine", 4, 0.25]]) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = bass * mult;
      g.gain.value = level;
      osc.connect(g).connect(flt);
      osc.start(t);
      osc.stop(t + len + 3.1);
    }
  }

  // Runs one tune. `cfg.play(time, info)` is called once per eighth note to schedule it.
  // cfg.level is the tune's overall loudness. Returns { stop() }, which fades the tune out.
  _startTrack(cfg) {
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, now);
    out.gain.exponentialRampToValueAtTime(cfg.level, now + cfg.fadeIn);
    out.connect(this._musicFX());

    // tremolo: the guitar's volume wavers gently, like an old amp
    const guitar = ctx.createGain();
    guitar.gain.value = 1 - cfg.tremolo;
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = cfg.tremoloRate;
    depth.gain.value = cfg.tremolo;
    lfo.connect(depth).connect(guitar.gain);
    lfo.start(now);
    guitar.connect(out);

    const chords = SoundFX.CHORDS;
    const eighth = 60 / cfg.bpm / 2;
    let step = 0;
    let nextTime = now + 0.15;
    const schedule = () => {
      while (nextTime < ctx.currentTime + 0.3) {
        const chordIx = Math.floor(step / 16) % chords.length;
        cfg.play(nextTime, {
          chord: chords[chordIx], chordIx, s: step % 16, step,
          pass: Math.floor(step / (16 * chords.length)), eighth, guitar, out,
        });
        step++;
        nextTime += eighth;
      }
    };
    schedule();
    const timer = setInterval(schedule, 50);

    return {
      stop: () => {
        clearInterval(timer);
        const t = ctx.currentTime;
        if (out.gain.cancelAndHoldAtTime) out.gain.cancelAndHoldAtTime(t);
        else out.gain.cancelScheduledValues(t);
        out.gain.setTargetAtTime(0.0001, t, 0.25);
        lfo.stop(t + 1.5);
        setTimeout(() => out.disconnect(), 1600);
      },
    };
  }

  // The lead line for chord `chordIx`, if a note falls on step `s`.
  _melodyNote(chordIx, s) {
    return SoundFX.MELODY[chordIx].find(([at]) => at === s);
  }

  // ---------- in-game music: the desert band, tense and rolling ----------

  startMusic() {
    const ctx = this._ensure();
    if (!ctx || this.music) return;
    this.music = this._startTrack({
      bpm: 84, level: 1.1, fadeIn: 2.5, tremolo: 0.22, tremoloRate: 5.2,
      play: (t, { chord, chordIx, s, step, pass, eighth, guitar, out }) => {
        if (s === 0) {
          this._drone(t, chord.bass, eighth * 16, out, 0.045);
          this._pluck(t, chord.bass * 2, guitar, { gain: 0.3, bright: 0.3 });
          this._tone(t, { f0: 90, f1: 45, dur: 0.6, gain: 0.16, bus: out }); // low tom on the chord change
        }
        // rolling arpeggio on every eighth note
        const order = [0, 1, 2, 3, 2, 1, 2, 1];
        this._pluck(t, chord.notes[order[s % 8]], guitar, {
          gain: s % 4 === 0 ? 0.17 : 0.11, bright: 0.32, dur: eighth * 3, pan: (order[s % 8] - 1.5) * 0.25,
        });
        // heartbeat drum: "lub-dub" on beats 1 and 3
        if (s % 8 === 0 || s % 8 === 4) {
          this._tone(t, { f0: 68, f1: 40, dur: 0.3, gain: 0.22, bus: out });
          this._tone(t + eighth * 0.45, { f0: 60, f1: 38, dur: 0.25, gain: 0.14, bus: out });
        }
        // shaker (a rattlesnake tail) on the off-beats
        if (s % 2 === 1) this._noise(t, { filter: "highpass", freq: 6500, dur: 0.07, gain: 0.035, bus: out });
        // the lead plays every other time through, so the band gets room on its own
        const note = pass % 2 === 0 && this._melodyNote(chordIx, s);
        if (note) this._pluck(t, note[1], guitar, { gain: 0.24, bright: 0.65, bend: note[2] || 0, pan: 0.2 });
      },
    });
  }

  stopMusic() {
    if (this.music) {
      this.music.stop();
      this.music = null;
    }
  }

  // ---------- menu music: the desert band, slow and lonesome ----------

  startMenuMusic() {
    this.wantMenuMusic = true;
    const ctx = this._ensure();
    if (!ctx || ctx.state !== "running" || this.menuMusic) return; // starts on unlock()
    this.menuMusic = this._startTrack({
      bpm: 60, level: 1.6, fadeIn: 4, tremolo: 0.3, tremoloRate: 4.2,
      play: (t, { chord, chordIx, s, pass, eighth, guitar, out }) => {
        if (s === 0) {
          this._drone(t, chord.bass, eighth * 16, out, 0.05);
          // a slow strum across the strings to open each chord
          [chord.bass * 2, ...chord.notes].forEach((f, i) =>
            this._pluck(t + i * 0.045, f, guitar, { gain: i === 0 ? 0.26 : 0.13, bright: 0.28, dur: 3 }));
        }
        // a few lazy picked notes in between
        const picks = { 4: 1, 6: 2, 8: 3, 10: 2, 12: 1, 14: 2 };
        if (s in picks) {
          this._pluck(t, chord.notes[picks[s]], guitar, { gain: 0.1, bright: 0.3, dur: 2.5, pan: (picks[s] - 1.5) * 0.3 });
        }
        // the lonesome lead
        const note = this._melodyNote(chordIx, s);
        if (note) this._pluck(t, note[1], guitar, { gain: 0.22, bright: 0.6, bend: note[2] || 0, pan: -0.15 });
      },
    });
  }

  stopMenuMusic() {
    this.wantMenuMusic = false;
    if (this.menuMusic) {
      this.menuMusic.stop();
      this.menuMusic = null;
    }
  }

  // ---------- wind: a continuous breeze that rises and falls in gusts ----------
  // Two filtered-noise layers (a low rumble and a thin whistle) whose loudness and pitch
  // drift to new random targets every couple of seconds.

  startWind() {
    this.wantWind = true;
    const ctx = this._ensure();
    if (!ctx || ctx.state !== "running" || this.wind) return; // starts on unlock()

    const layer = (type, freq, q) => {
      const src = ctx.createBufferSource();
      const flt = ctx.createBiquadFilter();
      const amp = ctx.createGain();
      src.buffer = this.noiseBuffer;
      src.loop = true;
      flt.type = type;
      flt.frequency.value = freq;
      flt.Q.value = q;
      amp.gain.value = 0.0001;
      src.connect(flt).connect(amp).connect(this.sfxBus);
      src.start();
      return { src, flt, amp };
    };
    const rumble = layer("lowpass", 350, 0.7);
    const whistle = layer("bandpass", 800, 6);

    const gust = () => {
      const t = ctx.currentTime;
      const strength = Math.random();
      rumble.amp.gain.setTargetAtTime(0.06 + strength * 0.12, t, 0.9);
      rumble.flt.frequency.setTargetAtTime(250 + strength * 450, t, 0.9);
      whistle.amp.gain.setTargetAtTime(0.01 + strength * 0.05, t, 1.1);
      whistle.flt.frequency.setTargetAtTime(600 + Math.random() * 700, t, 1.4);
    };
    gust();
    this.wind = { layers: [rumble, whistle], timer: setInterval(gust, 1800 + Math.random() * 900) };
  }

  stopWind() {
    this.wantWind = false;
    if (!this.wind) return;
    clearInterval(this.wind.timer);
    const t = this.ctx.currentTime;
    for (const l of this.wind.layers) {
      l.amp.gain.setTargetAtTime(0.0001, t, 0.25); // quick fade instead of a click
      l.src.stop(t + 1.2);
    }
    this.wind = null;
  }
}

const sfx = new SoundFX();
