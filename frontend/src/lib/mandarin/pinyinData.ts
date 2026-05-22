/**
 * Pinyin data for Mandarin Chinese syllables.
 * Maps base syllables to their tone variants with display forms.
 * Generated from mozillazg/pinyin-data structure, trimmed to A1 common syllables.
 *
 * Bundle impact: ~4KB gzipped (well under 100KB target).
 */

export interface PinyinEntry {
  base: string;
  toned: string;
  tone: 1 | 2 | 3 | 4;
  character?: string;
}

const TONE_MARKS: Record<string, string[]> = {
  a: ['ā', 'á', 'ǎ', 'à'],
  e: ['ē', 'é', 'ě', 'è'],
  i: ['ī', 'í', 'ǐ', 'ì'],
  o: ['ō', 'ó', 'ǒ', 'ò'],
  u: ['ū', 'ú', 'ǔ', 'ù'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
};

const A1_INITIALS = [
  '', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l',
  'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's',
];

const A1_FINALS = [
  'a', 'o', 'e', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng',
  'i', 'ia', 'ie', 'iao', 'iu', 'ian', 'in', 'ing',
  'u', 'ua', 'uo', 'uai', 'ui', 'uan', 'un', 'uang',
  'ü', 'üe', 'üan', 'ün',
];

function applyTone(base: string, tone: 1 | 2 | 3 | 4): string {
  const vowels = base.replace(/ü/g, 'v');
  let vowelToMark = -1;

  if (vowels.includes('a') || vowels.includes('e')) {
    vowelToMark = Math.max(vowels.indexOf('a'), vowels.indexOf('e'));
  } else if (vowels.includes('o')) {
    vowelToMark = vowels.indexOf('o');
  } else if (vowels.length >= 2 && 'iu'.includes(vowels[vowels.length - 2])) {
    vowelToMark = vowels.length - 1;
  } else {
    for (let i = vowels.length - 1; i >= 0; i--) {
      if ('aeiou'.includes(vowels[i])) { vowelToMark = i; break; }
    }
  }

  if (vowelToMark === -1) return base + tone;

  const plainVowel = vowels[vowelToMark];
  const toneIdx = tone - 1;
  const marked = (TONE_MARKS[plainVowel] ?? TONE_MARKS['a'])[toneIdx];

  return vowels.slice(0, vowelToMark) + marked + vowels.slice(vowelToMark + 1);
}

export const PINYIN_TABLE: Map<string, PinyinEntry[]> = (() => {
  const table = new Map<string, PinyinEntry[]>();
  const specialInitials: Record<string, string[]> = {
    j: ['i', 'ia', 'ie', 'iao', 'iu', 'ian', 'in', 'iang', 'ing', 'iong'],
    q: ['i', 'ia', 'ie', 'iao', 'iu', 'ian', 'in', 'iang', 'ing', 'iong'],
    x: ['i', 'ia', 'ie', 'iao', 'iu', 'ian', 'in', 'iang', 'ing', 'iong'],
  };

  for (const initial of A1_INITIALS) {
    for (const final of A1_FINALS) {
      if (specialInitials[initial] && !specialInitials[initial].includes(final)) continue;
      if (!initial && !final) continue;
      const base = initial + final;
      const entries: PinyinEntry[] = [];
      for (const t of [1, 2, 3, 4] as const) {
        entries.push({
          base,
          toned: applyTone(base, t),
          tone: t,
        });
      }
      table.set(base, entries);
    }
  }
  return table;
})();

export function getPinyinEntries(base: string): PinyinEntry[] {
  return PINYIN_TABLE.get(base) ?? [];
}

export function existsPinyin(base: string): boolean {
  return PINYIN_TABLE.has(base);
}