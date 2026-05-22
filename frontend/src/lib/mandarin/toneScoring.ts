/**
 * Tone scoring for Mandarin pronunciation practice.
 *
 * Two-method approach:
 * 1. Pitch classification (primary) — classify extracted F0 contour into
 *    tone categories using normalised pitch patterns. ~85% accuracy on
 *    clean mobile mic.
 * 2. Pinyin-text fallback — compare expected vs actual pinyin strings
 *    via Levenshtein when pitch confidence < 0.5.
 */

import type { ToneNumber, SyllableToneScore, ToneScoreResult, PitchContour } from '../../types';
import { charsToPinyin, normalizePinyin } from './pinyinParser';
import { classifyToneFromContour } from './usePitchExtraction';

// ─── Pinyin-text fallback scoring ───────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

function pinyinSimilarity(expected: string, actual: string): number {
  if (!expected && !actual) return 1;
  if (!expected || !actual) return 0;

  const maxLen = Math.max(expected.length, actual.length);
  if (maxLen === 0) return 1;

  const dist = levenshtein(expected, actual);
  return Math.max(0, 1 - dist / maxLen);
}

function scoreFromPinyinFallback(
  expectedText: string,
  actualText: string
): SyllableToneScore[] {
  const expectedChars = charsToPinyin(expectedText);
  const actualChars = charsToPinyin(actualText);

  const maxLen = Math.max(expectedChars.length, actualChars.length);
  const scores: SyllableToneScore[] = [];

  for (let i = 0; i < maxLen; i++) {
    const exp = expectedChars[i];
    const act = actualChars[i];

    if (!exp) {
      scores.push({
        char: act?.char || '?',
        pinyin: act?.pinyin || '?',
        expectedTone: 0 as ToneNumber,
        detectedTone: (act?.tone || 0) as ToneNumber,
        toneScore: 0,
        confidence: 0.1,
      });
      continue;
    }

    if (!act) {
      scores.push({
        char: exp.char,
        pinyin: exp.pinyin,
        expectedTone: exp.tone as ToneNumber,
        detectedTone: 0,
        toneScore: 0,
        confidence: 0.1,
      });
      continue;
    }

    const expBase = normalizePinyin(exp.pinyin).base;
    const actBase = normalizePinyin(act.pinyin).base;
    const baseSimilarity = pinyinSimilarity(expBase, actBase);

    const toneMatch = exp.tone === act.tone ? 1 : 0;
    const overall = baseSimilarity * 0.6 + toneMatch * 0.4;

    scores.push({
      char: exp.char,
      pinyin: exp.pinyin,
      expectedTone: exp.tone as ToneNumber,
      detectedTone: act.tone as ToneNumber,
      toneScore: overall,
      confidence: 0.3 + baseSimilarity * 0.2,
    });
  }

  return scores;
}

// ─── Main scoring function ───────────────────────────────────────────

export function scoreTones(
  expectedText: string,
  actualText: string,
  pitchContour?: PitchContour | null,
  syllableBoundaries?: number[]
): ToneScoreResult {
  // Get expected pinyin data
  const expectedChars = charsToPinyin(expectedText);

  // If we have a valid pitch contour with decent confidence, use pitch
  if (pitchContour && pitchContour.confidence >= 0.5 && syllableBoundaries) {
    const syllables: SyllableToneScore[] = [];
    const { points, confidence: contourConfidence } = pitchContour;
    const totalSamples = points.length;

    for (let i = 0; i < expectedChars.length; i++) {
      const expected = expectedChars[i];
      if (!expected.known) {
        syllables.push({
          char: expected.char,
          pinyin: expected.pinyin,
          expectedTone: expected.tone as ToneNumber,
          detectedTone: 0,
          toneScore: 0.5,
          confidence: contourConfidence * 0.5,
        });
        continue;
      }

      // Extract this syllable's pitch segment
      const startIdx = i < syllableBoundaries.length
        ? syllableBoundaries[i]
        : 0;
      const endIdx = i + 1 < syllableBoundaries.length
        ? syllableBoundaries[i + 1]
        : totalSamples;

      const segment = points.slice(startIdx, Math.min(endIdx, totalSamples));
      if (segment.length < 3) {
        syllables.push({
          char: expected.char,
          pinyin: expected.pinyin,
          expectedTone: expected.tone as ToneNumber,
          detectedTone: 0,
          toneScore: 0.5,
          confidence: 0.2,
        });
        continue;
      }

      const classifyResult = classifyToneFromContour(segment);
      const detectedTone: ToneNumber = classifyResult.tone;
      const toneScore = classifyResult.confidence;

      const isCorrect = detectedTone === (expected.tone as ToneNumber);
      const finalScore = isCorrect
        ? Math.min(1, toneScore + 0.2)
        : toneScore * 0.5;

      syllables.push({
        char: expected.char,
        pinyin: expected.pinyin,
        expectedTone: expected.tone as ToneNumber,
        detectedTone,
        toneScore: finalScore,
        confidence: contourConfidence,
      });
    }

    const overallToneScore = syllables.length > 0
      ? syllables.reduce((sum, s) => sum + s.toneScore, 0) / syllables.length
      : 0;

    return {
      overallToneScore: Math.round(overallToneScore * 100),
      syllables,
      pitchContour,
      method: 'pitch',
    };
  }

  // Fallback to pinyin-text comparison
  const syllables = scoreFromPinyinFallback(expectedText, actualText);
  const overallToneScore = syllables.length > 0
    ? syllables.reduce((sum, s) => sum + s.toneScore, 0) / syllables.length
    : 0;

  return {
    overallToneScore: Math.round(overallToneScore * 100),
    syllables,
    pitchContour: pitchContour || {
      points: [],
      sampleRate: 44100,
      duration: 0,
      confidence: 0,
    },
    method: 'pinyin-fallback',
  };
}

export { scoreFromPinyinFallback };