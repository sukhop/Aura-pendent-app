/**
 * Generates a looping siren WAV (1 s, 22050 Hz, mono 16-bit)
 * that sweeps 660 Hz ↔ 880 Hz at 1.5 cycles/sec and saves it to
 * artifacts/aura-pendant/assets/sounds/alarm.wav
 */
const fs = require("fs");
const path = require("path");

const SAMPLE_RATE = 22050;
const DURATION = 1.2; // seconds — one full siren cycle
const CENTER_FREQ = 770;
const SWEEP_AMP = 120; // ±120 Hz  ← 650–890 Hz range
const SWEEP_RATE = 1.4; // cycles per second

const numSamples = Math.floor(SAMPLE_RATE * DURATION);
const dataSize = numSamples * 2; // 16-bit = 2 bytes/sample
const buf = Buffer.alloc(44 + dataSize);

// ── RIFF/WAV header ───────────────────────────────────────────────────────────
buf.write("RIFF", 0, "ascii");
buf.writeUInt32LE(36 + dataSize, 4);
buf.write("WAVE", 8, "ascii");
buf.write("fmt ", 12, "ascii");
buf.writeUInt32LE(16, 16); // subchunk size
buf.writeUInt16LE(1, 20); // PCM = 1
buf.writeUInt16LE(1, 22); // mono
buf.writeUInt32LE(SAMPLE_RATE, 24);
buf.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
buf.writeUInt16LE(2, 32); // block align
buf.writeUInt16LE(16, 34); // bits per sample
buf.write("data", 36, "ascii");
buf.writeUInt32LE(dataSize, 40);

// ── PCM samples — phase-accumulation for smooth frequency sweep ───────────────
let phase = 0;
for (let i = 0; i < numSamples; i++) {
  const t = i / SAMPLE_RATE;
  // Smooth sine-based frequency modulation
  const freq = CENTER_FREQ + SWEEP_AMP * Math.sin(2 * Math.PI * t * SWEEP_RATE);
  phase += (2 * Math.PI * freq) / SAMPLE_RATE;

  // Apply fade-in/fade-out to avoid clicks (25 ms each end)
  const fadeLen = Math.floor(SAMPLE_RATE * 0.025);
  let envelope = 1;
  if (i < fadeLen) envelope = i / fadeLen;
  else if (i > numSamples - fadeLen) envelope = (numSamples - i) / fadeLen;

  const sample = Math.round(Math.sin(phase) * 0.8 * 32767 * envelope);
  buf.writeInt16LE(Math.max(-32768, Math.min(32767, sample)), 44 + i * 2);
}

// ── Write file ────────────────────────────────────────────────────────────────
const outDir = path.join(__dirname, "assets", "sounds");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "alarm.wav");
fs.writeFileSync(outPath, buf);

console.log(`✅ Alarm WAV written → ${outPath}`);
console.log(`   ${numSamples} samples · ${(buf.length / 1024).toFixed(1)} KB`);
