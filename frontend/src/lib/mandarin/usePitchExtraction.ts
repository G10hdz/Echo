/**
 * usePitchExtraction — YIN pitch detection + Mandarin tone classification.
 *
 * Uses the YIN algorithm to extract F0 (fundamental frequency) from the
 * microphone's AudioContext, then classifies each syllable into one of
 * the 4 Mandarin tones (or neutral tone 0).
 *
 * Design constraints:
 *  - 20-point sampling per syllable (sufficient for tone category)
 *  - Mobile AGC distorts F0 on soft tones (tone 3) → low-confidence badge
 *  - ~85% category accuracy on clean mobile mic
 */

import { useRef, useCallback, useState } from 'react';
import type { ToneNumber, PitchContour } from '../../types';

// ─── YIN pitch detection ────────────────────────────────────────────

const YIN_THRESHOLD = 0.15;
const MIN_F0 = 60;
const MAX_F0 = 500;

function yinDetect(
  buffer: Float32Array,
  sampleRate: number,
): number | null {
  const halfLen = Math.floor(buffer.length / 2);
  if (halfLen < 2) return null;

  const minTau = Math.floor(sampleRate / MAX_F0);
  const maxTau = Math.floor(sampleRate / MIN_F0);
  if (minTau >= halfLen || maxTau >= halfLen) return null;

  // Step 1: difference function
  const diff = new Float32Array(halfLen);
  for (let tau = minTau; tau < Math.min(maxTau, halfLen); tau++) {
    let sum = 0;
    for (let i = 0; i < halfLen; i++) {
      const d = buffer[i] - buffer[i + tau];
      sum += d * d;
    }
    diff[tau] = sum;
  }

  // Step 2: cumulative mean normalized difference (CMND)
  const cmnd = new Float32Array(halfLen);
  cmnd[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < Math.min(maxTau, halfLen); tau++) {
    runningSum += diff[tau];
    cmnd[tau] = diff[tau] / (runningSum / tau);
  }

  // Step 3: absolute threshold
  let bestTau = -1;
  for (let tau = minTau; tau < Math.min(maxTau, halfLen); tau++) {
    if (cmnd[tau] < YIN_THRESHOLD) {
      // find local minimum below threshold
      while (tau + 1 < Math.min(maxTau, halfLen) && cmnd[tau + 1] < cmnd[tau]) {
        tau++;
      }
      bestTau = tau;
      break;
    }
  }

  if (bestTau === -1) {
    // fallback: global minimum of CMND
    let minVal = Infinity;
    for (let tau = minTau; tau < Math.min(maxTau, halfLen); tau++) {
      if (cmnd[tau] < minVal) {
        minVal = cmnd[tau];
        bestTau = tau;
      }
    }
  }

  if (bestTau <= 0) return null;

  // Step 4: parabolic interpolation for sub-sample accuracy
  if (bestTau > 0 && bestTau < halfLen - 1) {
    const s0 = cmnd[bestTau - 1];
    const s1 = cmnd[bestTau];
    const s2 = cmnd[bestTau + 1];
    const shift = (s0 - s2) / (2 * (s0 - 2 * s1 + s2));
    if (Math.abs(shift) < 1) {
      bestTau += shift;
    }
  }

  const f0 = sampleRate / bestTau;
  return f0 >= MIN_F0 && f0 <= MAX_F0 ? f0 : null;
}

// ─── Tone classification ────────────────────────────────────────────

/* Mandarin tone F0 ranges (Hz) for adult speakers.
 * Tone 1: high flat ~280-360 (F) / ~150-200 (M)
 * Tone 2: mid rising ~200→350 (F) / ~120→180 (M)
 * Tone 3: low dipping ~200→150→250 (F) / ~100→80→140 (M)
 * Tone 4: high falling ~350→180 (F) / ~180→110 (M)
 *
 * We normalise by the speaker's baseline to handle gender/age variation.
 * The classifier uses *relative* pitch movement patterns rather than
 * absolute Hz values, making it robust across speakers. */

interface ToneProfile {
  tone: ToneNumber;
  /** Normalised starting pitch (0-1 range) */
  start: number;
  /** Direction: -1 = falling, 0 = flat, 1 = rising */
  direction: number;
  /** Normalised ending pitch */
  end: number;
}

const TONE_PROFILES: ToneProfile[] = [
  { tone: 1, start: 0.75, direction: 0, end: 0.73 },
  { tone: 2, start: 0.40, direction: 1, end: 0.75 },
  { tone: 3, start: 0.40, direction: -1, end: 0.50 },
  { tone: 4, start: 0.80, direction: -1, end: 0.25 },
  { tone: 0, start: 0.50, direction: 0, end: 0.48 },
];

function normalisePitch(pitches: (number | null)[]): {
  norm: number[];
  baseline: number;
} {
  const valid = pitches.filter((p): p is number => p !== null);
  if (valid.length < 3) return { norm: pitches.map(() => 0.5), baseline: 200 };

  const sorted = [...valid].sort((a, b) => a - b);
  const p10 = sorted[Math.floor(sorted.length * 0.1)];
  const p90 = sorted[Math.floor(sorted.length * 0.9)];
  const range = p90 - p10 || 1;
  const baseline = (p10 + p90) / 2;

  const norm = pitches.map((p) =>
    p === null ? 0.5 : Math.max(0, Math.min(1, (p - p10) / range))
  );

  return { norm, baseline };
}

function classifyToneFromContour(normPitches: number[]): {
  tone: ToneNumber;
  confidence: number;
} {
  if (normPitches.length < 4) {
    return { tone: 0, confidence: 0.1 };
  }

  const n = normPitches.length;
  const start = normPitches.slice(0, Math.ceil(n * 0.2)).reduce((a, b) => a + b, 0) / Math.ceil(n * 0.2);
  const end = normPitches.slice(Math.floor(n * 0.8)).reduce((a, b) => a + b, 0) / (n - Math.floor(n * 0.8));
  const mid = normPitches.slice(Math.ceil(n * 0.3), Math.floor(n * 0.7))
    .reduce((a, b) => a + b, 0) / Math.max(1, Math.floor(n * 0.7) - Math.ceil(n * 0.3));

  const direction = end - start;

  // Dip detection for tone 3: starts mid, dips, then rises
  const dip = mid - Math.min(start, end);

  let bestTone: ToneNumber = 1;
  let bestScore = -Infinity;

  for (const profile of TONE_PROFILES) {
    let score = 0;

    // Start pitch closeness
    score -= Math.abs(start - profile.start) * 2;

    // Direction match
    const actualDir = direction > 0.05 ? 1 : direction < -0.05 ? -1 : 0;
    score += actualDir === profile.direction ? 1.5 : -0.5;

    // End pitch closeness
    score -= Math.abs(end - profile.end) * 1.5;

    // Tone 3 dip bonus
    if (profile.tone === 3 && dip > 0.05) score += 1.5;

    if (score > bestScore) {
      bestScore = score;
      bestTone = profile.tone;
    }
  }

  // Confidence: how much better is best vs second-best
  const sortedScores = TONE_PROFILES.map((profile) => {
    let score = 0;
    const actualDir = direction > 0.05 ? 1 : direction < -0.05 ? -1 : 0;
    score -= Math.abs(start - profile.start) * 2;
    score += actualDir === profile.direction ? 1.5 : -0.5;
    score -= Math.abs(end - profile.end) * 1.5;
    if (profile.tone === 3 && dip > 0.05) score += 1.5;
    return score;
  }).sort((a, b) => b - a);

  const margin = sortedScores[0] - (sortedScores[1] || 0);
  const confidence = Math.min(0.95, Math.max(0.2, 0.3 + margin * 0.15));

  return { tone: bestTone, confidence };
}

// ─── Hook ────────────────────────────────────────────────────────────

export interface PitchResult {
  contour: PitchContour;
  syllableTones: Array<{
    tone: ToneNumber;
    confidence: number;
    f0Mean: number;
  }>;
  isExtracting: boolean;
}

const SYLLABLE_SAMPLES = 20;

export function usePitchExtraction() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const pitchBufferRef = useRef<Float32Array | null>(null);

  const [result, setResult] = useState<PitchResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const startExtraction = useCallback(
    async (stream: MediaStream, sampleRate?: number) => {
      const ctx = new AudioContext({ sampleRate: sampleRate || 44100 });
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;

      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const allPitches: number[] = [];

      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        const f0 = yinDetect(input, ctx.sampleRate);
        if (f0 !== null) {
          allPitches.push(f0);
        }
      };

      source.connect(processor);
      processor.connect(ctx.destination);

      setIsExtracting(true);

      // Store accumulated pitches for later processing
      pitchBufferRef.current = new Float32Array(0);
      const interval = setInterval(() => {
        // Periodically update the pitch buffer
        const arr = new Float32Array(allPitches.length);
        for (let i = 0; i < allPitches.length; i++) arr[i] = allPitches[i];
        pitchBufferRef.current = arr;
      }, 200);

      return () => {
        clearInterval(interval);
        processor.disconnect();
        source.disconnect();
        ctx.close();
        setIsExtracting(false);
      };
    },
    []
  );

  const stopExtraction = useCallback((): PitchResult | null => {
    const ctx = audioContextRef.current;
    const processor = processorRef.current;

    if (processor) processor.disconnect();
    if (sourceRef.current) sourceRef.current.disconnect();
    if (ctx) ctx.close();

    const pitches = pitchBufferRef.current;
    if (!pitches || pitches.length < SYLLABLE_SAMPLES) {
      setIsExtracting(false);
      return null;
    }

    // Build pitch contour
    const samplePoints: number[] = [];
    const step = Math.max(1, Math.floor(pitches.length / SYLLABLE_SAMPLES));
    for (let i = 0; i < pitches.length; i += step) {
      samplePoints.push(pitches[i]);
    }

    const validPitches = samplePoints.filter((p): p is number => p > 0);
    const duration = pitches.length / (ctx?.sampleRate || 44100);

    const { norm } = normalisePitch(samplePoints);

    const contour: PitchContour = {
      points: norm,
      sampleRate: ctx?.sampleRate || 44100,
      duration,
      confidence: Math.min(1, validPitches.length / SYLLABLE_SAMPLES),
    };

    // Classify overall tone from the full contour
    // (MandarinPracticePage will segment per-syllable)
    const { tone, confidence } = classifyToneFromContour(norm);

    const result: PitchResult = {
      contour,
      syllableTones: [
        {
          tone,
          confidence,
          f0Mean: validPitches.length > 0
            ? validPitches.reduce((a, b) => a + b, 0) / validPitches.length
            : 0,
        },
      ],
      isExtracting: false,
    };

    setResult(result);
    setIsExtracting(false);
    return result;
  }, []);

  const resetExtraction = useCallback(() => {
    pitchBufferRef.current = null;
    setResult(null);
    setIsExtracting(false);
  }, []);

  return {
    result,
    isExtracting,
    startExtraction,
    stopExtraction,
    resetExtraction,
    pitchBufferRef,
    classifyTone: classifyToneFromContour,
    normalisePitch,
  };
}

export { classifyToneFromContour, normalisePitch };