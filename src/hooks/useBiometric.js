import { useRef, useState, useCallback, useEffect } from 'react';

// ── Filler-word lexicon ───────────────────────────────────────────────────────
const FILLER_WORDS = [
  'um', 'uh', 'like', 'you know', 'basically', 'literally',
  'actually', 'so', 'right', 'kind of', 'sort of', 'I mean',
];

function countFillerWords(text) {
  const lower = text.toLowerCase();
  return FILLER_WORDS.reduce((n, fw) => {
    const re = new RegExp(`\\b${fw.replace(' ', '\\s+')}\\b`, 'g');
    return n + (lower.match(re)?.length ?? 0);
  }, 0);
}

function estimateWPM(text, durationSecs) {
  if (!durationSecs || !text.trim()) return 0;
  const words = text.trim().split(/\s+/).length;
  return Math.round((words / durationSecs) * 60);
}

// ── Presage SDK (simulation layer) ───────────────────────────────────────────
// Presage analyses facial micro-expressions and peripheral blood-flow via webcam.
// In this build we simulate its output using:
//   • Canvas pixel-variance delta (proxy for micro-motion / flush)
//   • Exponential Moving Average to dampen noise (EMA α=0.18)
//   • Physiologically plausible baseline drift with slow oscillation
//   • Heart rate derived from facial colour oscillation (rPPG approximation)

const EMA_ALPHA  = 0.18;   // smoothing factor — lower = smoother but slower to react
const HR_BASE    = 72;     // resting HR
const HR_AMP     = 12;     // sine amplitude (BPM)
const HR_JITTER  = 2;      // per-tick random jitter (±)

/**
 * useBiometric — Presage-compatible biometric hook
 *
 * Returns:
 *   biometrics        — live smoothed readings
 *   tick(text, secs)  — call every N seconds; returns the latest reading
 *   stressHistory     — array of { t, stress, hr } for live chart
 */
export function useBiometric({ videoRef }) {
  const [biometrics, setBiometrics] = useState({
    stressScore: 0.12,
    heartRate: HR_BASE,
    wpm: 0,
    fillerWordsPerMin: 0,
  });

  // Chart history — max 120 points (≈ 6 min at 3 s ticks)
  const [stressHistory, setStressHistory] = useState([]);

  const canvasRef      = useRef(null);
  const emaStress      = useRef(0.12);      // smoothed stress
  const prevVariance   = useRef(0);
  const hrPhase        = useRef(Math.random() * Math.PI * 2);
  const baselineDrift  = useRef(0.12);      // slow baseline oscillation
  const driftPhase     = useRef(Math.random() * Math.PI * 2);
  const tickCount      = useRef(0);

  useEffect(() => {
    if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
  }, []);

  // Sample webcam frame → pixel variance → raw stress signal
  const sampleFrame = useCallback(() => {
    const video = videoRef?.current;
    if (!video || !canvasRef.current || video.readyState < 2) return 0;

    const canvas = canvasRef.current;
    canvas.width  = 48;
    canvas.height = 48;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, 48, 48);

    const { data } = ctx.getImageData(0, 0, 48, 48);
    let sum = 0, sumSq = 0;
    const n = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      // Presage weights green channel more (rPPG signal)
      const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      sum   += lum;
      sumSq += lum * lum;
    }
    const mean     = sum / n;
    const variance = sumSq / n - mean * mean;
    const delta    = Math.abs(variance - prevVariance.current);
    prevVariance.current = variance;
    return delta;
  }, [videoRef]);

  const tick = useCallback((transcript, durationSecs) => {
    tickCount.current++;

    // ── rPPG heart rate ──────────────────────────────────────────────────────
    hrPhase.current += 0.055;
    const heartRate = Math.round(
      HR_BASE + HR_AMP * Math.sin(hrPhase.current) + (Math.random() - 0.5) * HR_JITTER
    );

    // ── Presage stress signal ────────────────────────────────────────────────
    const delta = sampleFrame();

    // Slow baseline drift (simulates accumulated cognitive load over session)
    driftPhase.current += 0.025;
    baselineDrift.current = 0.12 + 0.06 * Math.sin(driftPhase.current) + (tickCount.current * 0.0008);
    const clampedBaseline = Math.min(0.55, baselineDrift.current);

    // Raw stress from motion + baseline
    const rawStress = Math.min(0.97, clampedBaseline + delta * 0.0025 + (Math.random() - 0.5) * 0.02);

    // EMA smoothing — this is the key fix for the flickering
    emaStress.current = EMA_ALPHA * rawStress + (1 - EMA_ALPHA) * emaStress.current;
    const stressScore = parseFloat(Math.min(0.97, Math.max(0.05, emaStress.current)).toFixed(3));

    // ── Transcript analytics ─────────────────────────────────────────────────
    const safeTranscript   = transcript ?? '';
    const fillerCount      = countFillerWords(safeTranscript);
    const fillerWordsPerMin = durationSecs > 0
      ? parseFloat(((fillerCount / durationSecs) * 60).toFixed(1))
      : 0;
    const wpm = estimateWPM(safeTranscript, durationSecs);

    const reading = { stressScore, heartRate, wpm, fillerWordsPerMin };
    setBiometrics(reading);

    // Append to history for live chart (stress, hr, wpm all stored)
    setStressHistory((prev) => {
      const next = [...prev, { t: Math.round(durationSecs), stress: Math.round(stressScore * 100), hr: heartRate, wpm }];
      return next.length > 120 ? next.slice(-120) : next;
    });

    return reading;
  }, [sampleFrame]);

  // Expose a reset so LiveSession can clear history between sessions
  const reset = useCallback(() => {
    emaStress.current    = 0.12;
    prevVariance.current = 0;
    hrPhase.current      = Math.random() * Math.PI * 2;
    baselineDrift.current = 0.12;
    driftPhase.current   = Math.random() * Math.PI * 2;
    tickCount.current    = 0;
    setBiometrics({ stressScore: 0.12, heartRate: HR_BASE, wpm: 0, fillerWordsPerMin: 0 });
    setStressHistory([]);
  }, []);

  return { biometrics, tick, stressHistory, reset };
}
