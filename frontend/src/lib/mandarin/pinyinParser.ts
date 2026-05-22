/**
 * Pinyin parser and CJK segmentation utilities.
 *
 * - normalizePinyin: strip tone marks → base syllable with tone digit
 * - segmentSentence: split CJK text into character-level segments using Intl.Segmenter
 * - charsToPinyin: lookup pinyin for CJK characters (A1 subset)
 */

import { toneFromPinyin } from './toneColors';

const TONE_MARK_MAP: Record<string, [string, number]> = {
  ā: ['a', 1], á: ['a', 2], ǎ: ['a', 3], à: ['a', 4],
  ē: ['e', 1], é: ['e', 2], ě: ['e', 3], è: ['e', 4],
  ī: ['i', 1], í: ['i', 2], ǐ: ['i', 3], ì: ['i', 4],
  ō: ['o', 1], ó: ['o', 2], ǒ: ['o', 3], ò: ['o', 4],
  ū: ['u', 1], ú: ['u', 2], ǔ: ['u', 3], ù: ['u', 4],
  ǖ: ['v', 1], ǘ: ['v', 2], ǚ: ['v', 3], ǜ: ['v', 4],
};

export interface NormalizedPinyin {
  base: string;
  tone: number;
}

export function normalizePinyin(pinyin: string): NormalizedPinyin {
  let base = '';
  let tone = 0;

  for (const ch of pinyin) {
    if (TONE_MARK_MAP[ch]) {
      const [plain, t] = TONE_MARK_MAP[ch];
      base += plain;
      tone = t;
    } else if (ch >= '1' && ch <= '4') {
      tone = parseInt(ch, 10);
    } else {
      base += ch;
    }
  }

  return { base: base.toLowerCase(), tone };
}

export function cjkSegment(text: string): string[] {
  // Intl.Segmenter may not be available in all environments
  const hasSegmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl;
  if (hasSegmenter) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Seg = (Intl as any).Segmenter;
    const segmenter = new Seg('zh', { granularity: 'word' });
    const segments = Array.from(segmenter.segment(text)) as Array<{ segment: string; isWordLike?: boolean }>;
    return segments
      .filter(s => s.isWordLike || /[\u4e00-\u9fff]/.test(s.segment))
      .map(s => s.segment);
  }

  const result: string[] = [];
  let buffer = '';
  for (const ch of text) {
    if (/[\u4e00-\u9fff]/.test(ch)) {
      if (buffer) { result.push(buffer); buffer = ''; }
      result.push(ch);
    } else if (/[a-zA-Z0-9]/.test(ch)) {
      buffer += ch;
    } else {
      if (buffer) { result.push(buffer); buffer = ''; }
    }
  }
  if (buffer) result.push(buffer);
  return result;
}

const COMMON_CJK_PINYIN: Record<string, string> = {
  '我': 'wǒ', '你': 'nǐ', '他': 'tā', '她': 'tā', '是': 'shì',
  '的': 'de', '了': 'le', '在': 'zài', '有': 'yǒu', '不': 'bù',
  '人': 'rén', '这': 'zhè', '中': 'zhōng', '大': 'dà', '来': 'lái',
  '去': 'qù', '到': 'dào', '说': 'shuō', '会': 'huì', '对': 'duì',
  '出': 'chū', '能': 'néng', '好': 'hǎo', '很': 'hěn', '吗': 'ma',
  '一': 'yī', '二': 'èr', '三': 'sān', '四': 'sì', '五': 'wǔ',
  '六': 'liù', '七': 'qī', '八': 'bā', '九': 'jiǔ', '十': 'shí',
  '今': 'jīn', '天': 'tiān', '明': 'míng', '年': 'nián', '学': 'xué',
  '生': 'shēng', '老': 'lǎo', '师': 'shī', '朋': 'péng', '友': 'yǒu',
  '家': 'jiā', '国': 'guó', '名': 'míng', '吃': 'chī', '喝': 'hē',
  '看': 'kàn', '听': 'tīng', '写': 'xiě', '读': 'dú', '走': 'zǒu',
  '跑': 'pǎo', '买': 'mǎi', '卖': 'mài', '昨': 'zuó', '日': 'rì',
  '月': 'yuè', '时': 'shí', '那': 'nà', '哪': 'nǎ', '什': 'shén',
  '么': 'me', '多': 'duō', '少': 'shǎo', '小': 'xiǎo', '上': 'shàng',
  '下': 'xià', '里': 'lǐ', '东': 'dōng', '西': 'xī', '南': 'nán',
  '北': 'běi', '开': 'kāi', '关': 'guān', '猫': 'māo', '狗': 'gǒu',
  '书': 'shū', '水': 'shuǐ', '茶': 'chá', '饭': 'fàn', '菜': 'cài',
  '果': 'guǒ', '苹': 'píng', '红': 'hóng', '白': 'bái', '黑': 'hēi',
  '快': 'kuài', '慢': 'màn', '高': 'gāo', '低': 'dī',
  '冷': 'lěng', '热': 'rè', '新': 'xīn', '旧': 'jiù', '美': 'měi',
  '漂亮': 'piàoliang', '喜欢': 'xǐhuan', '谢谢': 'xièxie', '不客': 'búkè',
  '气': 'qì', '再见': 'zàijiàn', '你好': 'nǐhǎo', '早上': 'zǎoshang',
  '晚上': 'wǎnshang', '睡觉': 'shuìjiào', '工作': 'gōngzuò', '休息': 'xiūxi',
  '想': 'xiǎng', '要': 'yào', '可以': 'kěyǐ', '知道': 'zhīdào',
  '因为': 'yīnwèi', '所以': 'suǒyǐ', '但是': 'dànshì', '或者': 'huòzhě',
  '也': 'yě', '都': 'dōu', '还': 'hái', '最': 'zuì', '给': 'gěi',
  '从': 'cóng', '和': 'hé', '跟': 'gēn', '向': 'xiàng', '比': 'bǐ',
  '做': 'zuò', '用': 'yòng', '找': 'zhǎo', '打': 'dǎ', '坐': 'zuò',
  '住': 'zhù', '过': 'guò', '起': 'qǐ',
  '呢': 'ne', '吧': 'ba', '啊': 'a',
};

export interface CharPinyin {
  char: string;
  pinyin: string;
  tone: number;
  known: boolean;
}

export function charsToPinyin(text: string): CharPinyin[] {
  const segments = cjkSegment(text);
  const results: CharPinyin[] = [];

  for (const seg of segments) {
    if (/[\u4e00-\u9fff]/.test(seg)) {
      for (const ch of seg) {
        const pinyin = COMMON_CJK_PINYIN[ch];
        if (pinyin) {
          results.push({
            char: ch,
            pinyin,
            tone: toneFromPinyin(pinyin),
            known: true,
          });
        } else {
          results.push({ char: ch, pinyin: '?', tone: 0, known: false });
        }
      }
    } else {
      for (const ch of seg) {
        results.push({ char: ch, pinyin: ch, tone: 0, known: true });
      }
    }
  }

  return results;
}