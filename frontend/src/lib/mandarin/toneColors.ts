/**
 * Mandarin tone colors and labels for tone visualization.
 * Tone 1 → lavender, Tone 2 → pink, Tone 3 → gold, Tone 4 → green, Neutral → gray.
 */

export type ToneNumber = 1 | 2 | 3 | 4 | 0;

export const TONE_COLORS: Record<ToneNumber, string> = {
  1: '#C4B5E3',
  2: '#A85880',
  3: '#D4AF37',
  4: '#58A880',
  0: '#8A8A8A',
};

export const TONE_LABELS: Record<ToneNumber, string> = {
  1: 'Tone 1 ˉ',
  2: 'Tone 2 ˊ',
  3: 'Tone 3 ˇ',
  4: 'Tone 4 ˋ',
  0: 'Neutral',
};

export const TONE_DESCRIPTIONS: Record<ToneNumber, string> = {
  1: 'High level',
  2: 'Rising',
  3: 'Dip (low→mid)',
  4: 'Falling',
  0: 'Neutral / light',
};

export function toneColor(tone: ToneNumber): string {
  return TONE_COLORS[tone] ?? TONE_COLORS[0];
}

export function toneLabel(tone: ToneNumber): string {
  return TONE_LABELS[tone] ?? TONE_LABELS[0];
}

export function toneFromPinyin(pinyin: string): ToneNumber {
  const toneMarks: Record<string, ToneNumber> = {
    ā: 1, á: 2, ǎ: 3, à: 4,
    ē: 1, é: 2, ě: 3, è: 4,
    ī: 1, í: 2, ǐ: 3, ì: 4,
    ō: 1, ó: 2, ǒ: 3, ò: 4,
    ū: 1, ú: 2, ǔ: 3, ù: 4,
    ǖ: 1, ǘ: 2, ǚ: 3, ǜ: 4,
  };
  for (const ch of pinyin) {
    if (toneMarks[ch] !== undefined) return toneMarks[ch];
  }
  const digitMatch = pinyin.match(/[1-4]/);
  if (digitMatch) return Number(digitMatch[0]) as ToneNumber;
  return 0;
}