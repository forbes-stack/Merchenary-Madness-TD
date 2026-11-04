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
    this.musicTimer = null;
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
    if (ctx && ctx.state === "suspended") ctx.resume();
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

  // ---------- music: a looping western tune (A minor: Am - G - F - E) ----------

  startMusic() {
    const ctx = this._ensure();
    if (!ctx || this.musicTimer) return;

    const eighth = 60 / 100 / 2; // 100 bpm
    // Bass roots per bar (Hz): A2, G2, F2, E2. Pattern: root / fifth "oom-pah"
    const roots = [110, 98, 87.3, 82.4];
    // Whistled melody, one entry per eighth note (Hz, or 0 = rest), 4 bars
    const melody = [
      659, 0, 440, 0, 0, 523, 587, 0,
      659, 0, 587, 0, 494, 0, 0, 0,
      523, 0, 440, 0, 523, 587, 659, 0,
      587, 0, 494, 0, 415, 0, 0, 0,
    ];

    let step = 0;
    let nextTime = ctx.currentTime + 0.1;

    const schedule = () => {
      // schedule everything due in the next 0.2 s (setInterval timing is imprecise)
      while (nextTime < ctx.currentTime + 0.2) {
        const bar = Math.floor(step / 8) % 4;
        const beat = step % 8;
        const root = roots[bar];

        if (beat % 2 === 0) {
          const f = beat % 4 === 0 ? root : root * 1.5;
          this._tone(nextTime, { type: "triangle", f0: f, dur: eighth * 1.6, gain: 0.25, bus: this.musicBus });
        }
        // galloping hoofbeats: two quick taps per beat
        if (beat % 2 === 0) {
          this._noise(nextTime, { filter: "bandpass", freq: 900, q: 3, dur: 0.05, gain: 0.08, bus: this.musicBus });
          this._noise(nextTime + eighth * 0.5, { filter: "bandpass", freq: 700, q: 3, dur: 0.04, gain: 0.06, bus: this.musicBus });
        }

        const note = melody[step % melody.length];
        if (note) {
          // hold until the next note (or 3 eighths max)
          let len = 1;
          while (len < 3 && !melody[(step + len) % melody.length]) len++;
          this._tone(nextTime, { f0: note, dur: eighth * len * 0.95, gain: 0.1, bus: this.musicBus, vibrato: 6 });
        }

        step++;
        nextTime += eighth;
      }
    };

    schedule();
    this.musicTimer = setInterval(schedule, 50);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

const sfx = new SoundFX();
