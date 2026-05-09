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

export function ScoreDisplay({
  overallScore,
  grade,
  words,
  flagged,
  onRetry,
}: ScoreDisplayProps) {
  return (
    <div className="card" role="region" aria-label="Pronunciation score results">
      {/* Score Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
          >
            Your Score
          </h3>
          <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
            {words.length} words analyzed
            {gradeLabels[grade] && ` — ${gradeLabels[grade]}`}
          </p>
        </div>

        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: '100px',
            height: '100px',
            border: `3px solid var(--accent)`,
            backgroundColor: 'var(--accent-container)',
            flexShrink: 0,
          }}
          role="status"
          aria-label={`Score: ${overallScore} percent, Grade ${grade}`}
        >
          <div className="text-center">
            <div
              className="text-3xl font-bold"
              style={{
                color: 'var(--accent)',
                fontFamily: 'var(--font-headline)',
                lineHeight: 1,
              }}
            >
              {overallScore}%
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--on-accent-container)' }}>
              Grade {grade}
            </div>
          </div>
        </div>
      </div>

      {/* Word-Level Feedback */}
      <div className="mb-6">
        <h4
          className="text-lg font-semibold mb-4"
          style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
        >
          Word-by-Word Feedback
        </h4>

        <div className="flex flex-wrap gap-2 md:gap-3">
          {words.map((word, index) => {
            const statusKey = (word.status || 'correct') as keyof typeof statusConfig;
            const status = statusConfig[statusKey] || statusConfig.correct;
            const Icon = status.Icon;

            return (
              <div
                key={`${word.word}-${index}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg"
                style={{
                  backgroundColor: status.bg,
                  borderLeft: `3px solid ${status.color}`,
                }}
              >
                <Icon
                  size={16}
                  style={{ color: status.color, flexShrink: 0 }}
                  aria-hidden="true"
                />
              <div>
                <span className="font-medium text-sm truncate max-w-[150px] md:max-w-none block" style={{ color: 'var(--on-surface)' }}>
                  {word.word}
                </span>
                {word.said && (
                  <span
                    className="text-xs block truncate max-w-[150px] md:max-w-none"
                    style={{ color: 'var(--on-surface-variant)' }}
                  >
                    <ArrowRight size={10} style={{ display: 'inline' }} aria-hidden="true" /> {word.said}
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
              </div>
            );
          })}
        </div>
      </div>

      {/* Flagged Words Summary */}
      {flagged.length > 0 && (
        <div
          className="rounded-lg p-4"
          style={{
            backgroundColor: 'var(--surface-container-low)',
            border: '1px solid var(--outline-variant)',
          }}
        >
          <h4
            className="text-md font-semibold mb-3"
            style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
          >
            Words to practice ({flagged.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {flagged.map((word, index) => {
              const statusKey = (word.status || 'incorrect') as keyof typeof statusConfig;
              const status = statusConfig[statusKey] || statusConfig.incorrect;

              return (
                <span
                  key={`flagged-${index}`}
                  className="px-3 py-1 rounded-full text-sm font-medium max-w-full truncate"
                  style={{
                    backgroundColor: status.bg,
                    color: status.color,
                  }}
                >
                  {word.word} <ArrowRight size={10} style={{ display: 'inline' }} aria-hidden="true" /> {word.said || 'missed'}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}