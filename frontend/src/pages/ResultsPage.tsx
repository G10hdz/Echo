import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RotateCcw, Home, Play } from 'lucide-react';
import type { ScoreResponse } from '../types';

interface ResultsState {
  score: ScoreResponse;
  sentence: string;
}

export function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ResultsState | null;

  if (!state?.score) {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-12 text-center">
        <p style={{ color: 'var(--on-surface-variant)' }}>No session data. Start a practice session first.</p>
        <button
          onClick={() => navigate('/practice')}
          className="mt-4 btn-primary"
        >
          Go to Practice
        </button>
      </div>
    );
  }

  const { score, sentence } = state;
  const scorePercent = Math.round(score.overall_score);
  const circumference = 2 * Math.PI * 54;
  const strokeDash = (scorePercent / 100) * circumference;

  const correctWords = score.words.filter((w) => w.status === 'correct').length;
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 md:py-12">
      {/* Terminal label */}
      <motion.p
        className="text-xs tracking-[0.2em] uppercase mb-8 opacity-60"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--on-surface-variant)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
      >
        {`> SESSION COMPLETE // ${today}`}
      </motion.p>

      {/* Circular score ring */}
      <motion.div
        className="flex justify-center mb-8"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: 'spring' as const }}
      >
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            {/* Track */}
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="var(--ghost-border)"
              strokeWidth="8"
            />
            {/* Progress */}
            <motion.circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - strokeDash }}
              transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
              style={{ filter: 'drop-shadow(0 0 8px var(--lavender-glow))' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-3xl font-bold"
              style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
            >
              {scorePercent}%
            </span>
            <span className="text-xs uppercase" style={{ color: 'var(--on-surface-variant)' }}>
              {score.grade}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Stats chips */}
      <motion.div
        className="grid grid-cols-3 gap-3 mb-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {[
          { label: 'Words Practiced', value: score.words.length },
          { label: 'Correct', value: correctWords },
          { label: 'Flagged', value: score.flagged.length },
        ].map((stat) => (
          <div
            key={stat.label}
            className="card text-center py-4"
            style={{
              backgroundColor: 'var(--glass-bg)',
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--glass-border)',
            }}
          >
            <p className="text-xl font-bold" style={{ color: 'var(--on-surface)' }}>
              {stat.value}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--on-surface-variant)' }}>
              {stat.label}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Gradient divider */}
      <div
        className="h-px mb-8"
        style={{
          background: 'linear-gradient(90deg, var(--primary), var(--accent), var(--primary))',
          opacity: 0.3,
        }}
      />

      {/* Phoneme breakdown */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h3
          className="text-xs uppercase tracking-widest mb-4"
          style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface-variant)' }}
        >
          Word Breakdown
        </h3>
        <div className="flex flex-wrap gap-2">
          {score.words.map((word, i) => {
            const colorMap = {
              correct: { bg: 'var(--score-correct-bg)', border: 'var(--score-correct)', color: 'var(--score-correct)' },
              partial: { bg: 'var(--score-partial-bg)', border: 'var(--score-partial)', color: 'var(--score-partial)' },
              incorrect: { bg: 'var(--score-incorrect-bg)', border: 'var(--score-incorrect)', color: 'var(--score-incorrect)' },
              missed: { bg: 'var(--score-missed-bg)', border: 'var(--score-missed)', color: 'var(--score-missed)' },
              extra: { bg: 'var(--score-missed-bg)', border: 'var(--score-missed)', color: 'var(--score-missed)' },
            };
            const colors = colorMap[word.status];
            return (
              <span
                key={i}
                className="px-3 py-1.5 rounded text-sm font-medium"
                style={{
                  backgroundColor: colors.bg,
                  borderBottom: `2px solid ${colors.border}`,
                  color: colors.color,
                }}
              >
                {word.word}
              </span>
            );
          })}
        </div>
      </motion.div>

      {/* Sentence practiced */}
      <motion.div
        className="card mb-8 p-4"
        style={{ border: '1px solid var(--ghost-border)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--on-surface-variant)' }}>
          Target Sentence
        </p>
        <p className="text-base font-medium flex items-center gap-2" style={{ color: 'var(--on-surface)' }}>
          <Play size={14} style={{ color: 'var(--primary)' }} />
          {sentence}
        </p>
      </motion.div>

      {/* Actions */}
      <motion.div
        className="flex gap-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <motion.button
          onClick={() => navigate('/practice')}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
          style={{
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            color: 'white',
            boxShadow: 'var(--shadow-md)',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <RotateCcw size={16} />
          PRACTICE AGAIN
        </motion.button>

        <motion.button
          onClick={() => navigate('/')}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm"
          style={{
            border: '1px solid var(--ghost-border)',
            color: 'var(--on-surface-variant)',
          }}
          whileHover={{ scale: 1.02, backgroundColor: 'var(--surface-container-low)' }}
          whileTap={{ scale: 0.98 }}
        >
          <Home size={16} />
          HOME
        </motion.button>
      </motion.div>
    </div>
  );
}
