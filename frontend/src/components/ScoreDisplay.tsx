import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WordScore } from '../types';
import { CheckCircle, XCircle, AlertTriangle, MinusCircle, ArrowRight } from 'lucide-react';

interface ScoreDisplayProps {
  overallScore: number;
  grade: string;
  words: WordScore[];
  flagged: WordScore[];
  onRetry?: (word: string) => void;
}

const statusConfig = {
  correct: {
    color: 'var(--score-correct)',
    bg: 'var(--score-correct-bg)',
    Icon: CheckCircle,
    label: 'Correct',
  },
  partial: {
    color: 'var(--score-partial)',
    bg: 'var(--score-partial-bg)',
    Icon: AlertTriangle,
    label: 'Partial',
  },
  incorrect: {
    color: 'var(--score-incorrect)',
    bg: 'var(--score-incorrect-bg)',
    Icon: XCircle,
    label: 'Incorrect',
  },
  missed: {
    color: 'var(--score-missed)',
    bg: 'var(--score-missed-bg)',
    Icon: MinusCircle,
    label: 'Missed',
  },
  extra: {
    color: 'var(--score-missed)',
    bg: 'var(--score-missed-bg)',
    Icon: AlertTriangle,
    label: 'Extra',
  },
};

const gradeLabels: Record<string, string> = {
  'A+': 'Excellent',
  A: 'Great',
  'B+': 'Good',
  B: 'Satisfactory',
  C: 'Needs Work',
  D: 'Poor',
  F: 'Try Again',
};

/* ------------------------------------------------------------------ */
/*  Color helper for the progress ring                                  */
/* ------------------------------------------------------------------ */
const getScoreColor = (score: number) => {
  if (score >= 90) return 'var(--score-correct)';
  if (score >= 70) return 'var(--score-partial)';
  if (score >= 50) return 'var(--warm-gold)';
  return 'var(--score-incorrect)';
};

export function ScoreDisplay({
  overallScore,
  grade,
  words,
  flagged,
  onRetry,
}: ScoreDisplayProps) {
  const [displayedScore, setDisplayedScore] = useState(0);

  /* ---------------------------------------------------------------- */
  /*  Counting-up score animation                                       */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    const duration = 1400;
    const start = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayedScore(Math.round(eased * overallScore));

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [overallScore]);

  const ringColor = getScoreColor(overallScore);
  const ringBg = 'var(--surface-container-low)';
  const size = 144;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayedScore / 100) * circumference;

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.035,
        delayChildren: 0.25,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.94 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring' as const, stiffness: 380, damping: 22 },
    },
  };

  return (
    <motion.div
      className="card"
      role="region"
      aria-label="Pronunciation score results"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as [number,number,number,number] }}
    >
      {/* ================================================================ */}
      {/*  Circular progress + score header                                */}
      {/* ================================================================ */}
      <div className="flex flex-col items-center mb-8 pt-2">
        <div
          className="relative mb-5"
          role="status"
          aria-label={`Score: ${displayedScore} percent, Grade ${grade}`}
        >
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Background track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={ringBg}
              strokeWidth={strokeWidth}
            />
            {/* Animated progress ring */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={ringColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: 1.3, ease: [0.25, 0.1, 0.25, 1] as [number,number,number,number] }
              }
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.06))' }}
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              className="text-[2.75rem] font-bold leading-none tracking-tight"
              style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25, type: 'spring' as const, stiffness: 300, damping: 18 }}
            >
              {displayedScore}
              <span className="text-lg font-medium ml-0.5" style={{ color: 'var(--on-surface-variant)' }}>
                %
              </span>
            </motion.div>
            <motion.div
              className="text-xs font-semibold uppercase tracking-widest mt-1"
              style={{ color: ringColor }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {grade}
            </motion.div>
          </div>
        </div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h3
            className="text-xl font-bold mb-1"
            style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
          >
            {gradeLabels[grade] || 'Score'}
          </h3>
          <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
            {words.length} words analyzed
          </p>
        </motion.div>
      </div>

      {/* ================================================================ */}
      {/*  Word-level feedback — staggered dopamine reveal                 */}
      {/* ================================================================ */}
      <div className="mb-6">
        <motion.h4
          className="text-lg font-semibold mb-4"
          style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          Word-by-Word Feedback
        </motion.h4>

        <motion.div
          className="flex flex-wrap gap-2 md:gap-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {words.map((word, index) => {
            const statusKey = (word.status || 'correct') as keyof typeof statusConfig;
            const status = statusConfig[statusKey] || statusConfig.correct;
            const Icon = status.Icon;

            return (
              <motion.div
                key={`${word.word}-${index}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg cursor-default"
                style={{
                  backgroundColor: status.bg,
                  borderLeft: `3px solid ${status.color}`,
                }}
                variants={itemVariants}
                whileHover={{ scale: 1.04, y: -2, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.97 }}
              >
                <Icon
                  size={16}
                  style={{ color: status.color, flexShrink: 0 }}
                  aria-hidden="true"
                />
                <div>
                  <span
                    className="font-medium text-sm truncate max-w-[150px] md:max-w-none block"
                    style={{ color: 'var(--on-surface)' }}
                  >
                    {word.word}
                  </span>
                  {word.said && (
                    <span
                      className="text-xs block truncate max-w-[150px] md:max-w-none"
                      style={{ color: 'var(--on-surface-variant)' }}
                    >
                      <ArrowRight size={10} style={{ display: 'inline' }} aria-hidden="true" />{' '}
                      {word.said}
                    </span>
                  )}
                </div>
                {word.status !== 'correct' && onRetry && (
                  <button
                    onClick={() => onRetry(word.word)}
                    className="ml-1 text-xs font-medium hover:underline"
                    style={{ color: status.color }}
                    aria-label={`Retry the word "${word.word}"`}
                  >
                    Retry
                  </button>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ================================================================ */}
      {/*  Flagged words summary                                           */}
      {/* ================================================================ */}
      <AnimatePresence>
        {flagged.length > 0 && (
          <motion.div
            className="rounded-lg p-4 overflow-hidden"
            style={{
              backgroundColor: 'var(--surface-container-low)',
              border: '1px solid var(--outline-variant)',
            }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ delay: 0.55, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number,number,number,number] }}
          >
            <h4
              className="text-base font-semibold mb-3"
              style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
            >
              Words to practice ({flagged.length})
            </h4>
            <motion.div
              className="flex flex-wrap gap-2"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {flagged.map((word, index) => {
                const statusKey = (word.status || 'incorrect') as keyof typeof statusConfig;
                const status = statusConfig[statusKey] || statusConfig.incorrect;

                return (
                  <motion.span
                    key={`flagged-${index}`}
                    className="px-3 py-1 rounded-full text-sm font-medium max-w-full truncate"
                    style={{
                      backgroundColor: status.bg,
                      color: status.color,
                    }}
                    variants={itemVariants}
                    whileHover={{ scale: 1.06 }}
                  >
                    {word.word}{' '}
                    <ArrowRight size={10} style={{ display: 'inline' }} aria-hidden="true" />{' '}
                    {word.said || 'missed'}
                  </motion.span>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
