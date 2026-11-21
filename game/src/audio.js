// Synthesised sound, in-browser only: no audio files, no network. WebAudio builds every
// sound from oscillators and filtered noise — guard footsteps that grow louder as a guard
// nears, an alarm sting when a guard spots the courier, chimes for intel, win and loss.

export function createAudio() {
  let ctx = null;
  let master = null;

  function ensure() {
    if (ctx) return true;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  function tone(freq, dur, type, vol, when = 0) {
    if (!ensure()) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noiseBurst(dur, vol, cutoff) {
    if (!ensure()) return;
    const t0 = ctx.currentTime;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const gain = ctx.createGain();
    gain.gain.value = vol;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(t0);
  }

  return {
    /** Call on the first user gesture so the browser lets sound start. */
    unlock() {
      if (ensure() && ctx.state === 'suspended') void ctx.resume();
    },
    /** A guard's footstep; `distance` (px) sets the volume, so steps tell you where guards are. */
    footstep(distance) {
      const vol = Math.max(0, 0.22 * (1 - distance / 420));
      if (vol > 0.01) noiseBurst(0.07, vol, 420);
    },
    /** Two-tone alarm when a guard's meter fills and the chase begins. */
    alert() {
      tone(620, 0.16, 'square', 0.12);
      tone(830, 0.22, 'square', 0.12, 0.14);
    },
    /** A soft blip when a guard grows suspicious. */
    suspicious() {
      tone(440, 0.12, 'triangle', 0.08);
    },
    /** A bright arpeggio for lifting an intel file. */
    pickup() {
      tone(880, 0.1, 'sine', 0.14);
      tone(1174, 0.14, 'sine', 0.14, 0.08);
    },
    /** A low thud for being caught. */
    caught() {
      tone(160, 0.3, 'sawtooth', 0.16);
      tone(110, 0.4, 'sawtooth', 0.14, 0.12);
    },
    /** The escape jingle. */
    win() {
      [523, 659, 784, 1046].forEach((freq, index) => tone(freq, 0.22, 'sine', 0.14, index * 0.11));
    },
    /** The game-over descent. */
    lose() {
      [392, 330, 262, 196].forEach((freq, index) => tone(freq, 0.25, 'triangle', 0.12, index * 0.13));
    },
  };
}
