import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { charsToPinyin } from '../../lib/mandarin/pinyinParser';
import { toneColor, type ToneNumber } from '../../lib/mandarin/toneColors';

interface PinyinOverlayProps {
  text: string;
  className?: string;
}

export function PinyinOverlay({ text, className = '' }: PinyinOverlayProps) {
  const [visible, setVisible] = useState(true);

  const charPinyinList = useMemo(() => charsToPinyin(text), [text]);

  return (
    <div className={`${className}`}>
      <button
        onClick={() => setVisible((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium mb-2 transition-colors"
        style={{ color: 'var(--on-surface-variant)' }}
        aria-label={visible ? 'Hide pinyin' : 'Show pinyin'}
        aria-pressed={visible}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className="inline-block"
        >
          <text
            x="2"
            y="12"
            fontSize="11"
            fill="currentColor"
            fontFamily="var(--font-body)"
          >
            {'注'}
          </text>
        </svg>
        Pinyin
      </button>

      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
              {charPinyinList.map((cp, i) => (
                <span
                  key={`${cp.char}-${i}`}
                  className="inline-flex flex-col items-center leading-none"
                >
                  <span
                    className="text-[11px] font-medium"
                    style={{
                      color: cp.known && cp.tone
                        ? toneColor(cp.tone as ToneNumber)
                        : 'var(--on-surface-variant)',
                      fontFamily: 'var(--font-body)',
                      opacity: cp.known ? 1 : 0.45,
                    }}
                  >
                    {cp.pinyin}
                  </span>
                  <span
                    className="text-base font-bold mt-0.5"
                    style={{
                      color: 'var(--on-surface)',
                      fontFamily: 'var(--font-headline)',
                    }}
                  >
                    {cp.char}
                  </span>
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}