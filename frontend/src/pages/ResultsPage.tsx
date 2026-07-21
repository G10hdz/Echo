import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RotateCcw, Home, Play } from 'lucide-react';
import type { ScoreResponse } from '../types';

interface ResultsState {
  score: ScoreResponse;
  sentence: string;
}

const SPRING = [0.32, 0.72, 0, 1] as const;

function scoreColor(pct: number): string {
  if (pct >= 80) return 'var(--score-hi)';
  if (pct >= 60) return 'var(--score-mid)';
  return 'var(--score-lo)';
}

export function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ResultsState | null;

  if (!state?.score) {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-12 text-center">
        <p style={{ color: 'var(--muted)' }}>
          No hay datos de sesión. Empieza una práctica primero.
        </p>
        <button type="button" onClick={() => navigate('/practice')} className="mt-4 btn-primary">
          Ir a practicar
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
      <p className="terminal-label mb-8">{`SESIÓN COMPLETADA // ${today}`}</p>

      {/* Ring de score con color semántico */}
      <motion.div
        className="flex justify-center mb-8"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: SPRING }}
      >
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
            {/* Track visible en ambos temas */}
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="var(--border-light)"
              strokeWidth="8"
            />
            <motion.circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={scoreColor(scorePercent)}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - strokeDash }}
              transition={{ duration: 1.2, delay: 0.3, ease: SPRING }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-3xl font-bold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--fg)' }}
            >
              {scorePercent}%
            </span>
            <span className="text-xs uppercase" style={{ color: 'var(--muted)' }}>
              {score.grade}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Stats chips — colapsa a 1 columna en móvil */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, ease: SPRING }}
      >
        {[
          { label: 'Palabras practicadas', value: score.words.length },
          { label: 'Correctas', value: correctWords },
          { label: 'Marcadas', value: score.flagged.length },
        ].map((stat) => (
          <div key={stat.label} className="card text-center py-4">
            <p className="text-xl font-bold" style={{ color: 'var(--fg)' }}>
              {stat.value}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              {stat.label}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Desglose por palabra */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, ease: SPRING }}
      >
        <h3
          className="text-xs uppercase tracking-widest mb-4"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--muted)' }}
        >
          Desglose por palabra
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
                key={`${word.word}-${i}`}
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

      {/* Frase objetivo */}
      <motion.div
        className="card mb-8 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, ease: SPRING }}
      >
        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
          Frase objetivo
        </p>
        <p className="text-base font-medium flex items-center gap-2" style={{ color: 'var(--fg)' }}>
          <Play size={14} style={{ color: 'var(--teal)' }} aria-hidden="true" />
          {sentence}
        </p>
      </motion.div>

      {/* Acciones */}
      <motion.div
        className="flex flex-col sm:flex-row gap-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, ease: SPRING }}
      >
        <button
          type="button"
          onClick={() => navigate('/practice')}
          className="btn-primary flex-1"
        >
          <RotateCcw size={16} aria-hidden="true" />
          Practicar de nuevo
        </button>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="btn-secondary"
        >
          <Home size={16} aria-hidden="true" />
          Inicio
        </button>
      </motion.div>
    </div>
  );
}
