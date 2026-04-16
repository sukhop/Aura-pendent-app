/**
 * Generates a louder, more aggressive siren WAV.
 *
 * Changes vs original:
 *  - Amplitude: 0.8 → 0.97 (near digital full-scale)
 *  - Waveform: pure sine → soft-clipped sine via tanh(x · 4.0)
 *    This adds odd harmonics (sounds like a buzzer/klaxon) which are
 *    far more audible through phone speakers than a pure sine tone.
 *  - Duration: 1.2 s → 2.0 s (smoother loop)
 *  - Added a subtle amplitude envelope so the loop cross-fade is click-free
 */
const fs = require("fs");
const path = require("path");

const SAMPLE_RATE = 22050;
const DURATION    = 2.0;            // seconds — full siren cycle
const CENTER_FREQ = 770;            // Hz
const SWEEP_AMP   = 130;            // ±Hz around centre
const SWEEP_RATE  = 1.4;            // full sweeps per second
const DRIVE       = 4.5;            // tanh drive — higher = more harmonics / louder perceived
const AMPLITUDE   = 0.97;          // peak output level (0–1)
const FADE_MS     = 30;             // fade in / out to avoid clicks

const numSamples = Math.floor(SAMPLE_RATE * DURATION);
const dataSize   = numSamples * 2;          // 16-bit = 2 bytes
const buf        = Buffer.alloc(44 + dataSize);

// ── WAV header ────────────────────────────────────────────────────────────────
buf.write("RIFF", 0, "ascii");
buf.writeUInt32LE(36 + dataSize, 4);
buf.write("WAVE", 8, "ascii");
buf.write("fmt ", 12, "ascii");
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);               // PCM
buf.writeUInt16LE(1, 22);               // mono
buf.writeUInt32LE(SAMPLE_RATE, 24);
buf.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
buf.writeUInt16LE(2, 32);               // block align
buf.writeUInt16LE(16, 34);              // bits per sample
buf.write("data", 36, "ascii");
buf.writeUInt32LE(dataSize, 40);

// ── PCM samples ───────────────────────────────────────────────────────────────
const fadeSamples = Math.floor(SAMPLE_RATE * (FADE_MS / 1000));
let phase = 0;

for (let i = 0; i < numSamples; i++) {
  const t    = i / SAMPLE_RATE;
  const freq = CENTER_FREQ + SWEEP_AMP * Math.sin(2 * Math.PI * SWEEP_RATE * t);
  phase += (2 * Math.PI * freq) / SAMPLE_RATE;

  // Soft clipper: tanh adds harmonics → louder perceived loudness
  const raw      = Math.sin(phase);
  const clipped  = Math.tanh(raw * DRIVE) / Math.tanh(DRIVE); // normalize to ±1

  // Click-free fade in / out at loop boundaries
  let envelope = 1;
  if (i < fadeSamples)             envelope = i / fadeSamples;
  else if (i > numSamples - fadeSamples) envelope = (numSamples - i) / fadeSamples;

  const sample  = Math.round(clipped * AMPLITUDE * 32767 * envelope);
  buf.writeInt16LE(Math.max(-32768, Math.min(32767, sample)), 44 + i * 2);
}

// ── Write ─────────────────────────────────────────────────────────────────────
const outDir  = path.join(__dirname, "assets", "sounds");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "alarm.wav");
fs.writeFileSync(outPath, buf);

const peakDB = 20 * Math.log10(AMPLITUDE);
console.log(`✅ Loud siren WAV → ${outPath}`);
console.log(`   ${numSamples} samples · ${DURATION}s · ${(buf.length / 1024).toFixed(1)} KB`);
console.log(`   Peak: ${peakDB.toFixed(1)} dBFS  Drive: ${DRIVE}×tanh  Sweep: ${CENTER_FREQ}±${SWEEP_AMP} Hz`);
