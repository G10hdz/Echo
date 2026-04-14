// Score display component with color-coded word feedback

import type { WordScore } from '../types';
import { Check, X, AlertCircle } from 'lucide-react';

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
    icon: Check,
    label: 'Correct',
  },
  partial: {
    color: 'var(--score-partial)',
    icon: AlertCircle,
    label: 'Partial',
  },
  incorrect: {
    color: 'var(--score-incorrect)',
    icon: X,
    label: 'Incorrect',
  },
  missed: {
    color: 'var(--score-missed)',
    icon: X,
    label: 'Missed',
  },
  extra: {
    color: 'var(--score-missed)',
    icon: AlertCircle,
    label: 'Extra',
  },
};

export function ScoreDisplay({
  overallScore,
  grade,
  words,
  flagged,
  onRetry,
}: ScoreDisplayProps) {
  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'var(--score-correct)';
    if (grade.startsWith('B')) return 'var(--score-correct)';
    if (grade.startsWith('C')) return 'var(--score-partial)';
    if (grade.startsWith('D')) return 'var(--score-partial)';
    return 'var(--score-incorrect)';
  };

  return (
    <div className="card">
      {/* Overall Score Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            Your Score
          </h3>
          <p style={{ color: 'var(--on-surface-variant)' }}>
            {words.length} words analyzed
          </p>
        </div>

        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: '120px',
            height: '120px',
            background: `linear-gradient(135deg, ${getGradeColor(grade)}, ${getGradeColor(grade)}88)`,
            boxShadow: `0 8px 32px ${getGradeColor(grade)}33`,
          }}
        >
          <div className="text-center text-white">
            <div className="text-4xl font-bold">{overallScore}%</div>
            <div className="text-lg font-semibold">Grade {grade}</div>
          </div>
        </div>
      </div>

      {/* Word-Level Feedback */}
      <div className="mb-6">
        <h4
          className="text-lg font-semibold mb-4"
          style={{ fontFamily: 'var(--font-headline)' }}
        >
          Word-by-Word Feedback
        </h4>

        <div className="flex flex-wrap gap-3">
          {words.map((word, index) => {
            const config = statusConfig[word.status];
            const Icon = config.icon;

            return (
              <div
                key={index}
                className="flex items-center gap-2 px-4 py-3 rounded-lg"
                style={{
                  backgroundColor: `${config.color}15`,
                  borderLeft: `4px solid ${config.color}`,
                }}
              >
                <Icon
                  size={18}
                  style={{ color: config.color, flexShrink: 0 }}
                />
                <div>
                  <div className="font-semibold">{word.word}</div>
                  {word.said && (
                    <div
                      className="text-sm"
                      style={{ color: 'var(--on-surface-variant)' }}
                    >
                      You said: "{word.said}"
                    </div>
                  )}
                </div>
                {word.status !== 'correct' && onRetry && (
                  <button
                    onClick={() => onRetry(word.word)}
                    className="ml-2 text-sm font-medium hover:underline"
                    style={{ color: config.color }}
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
          }}
        >
          <h4
            className="text-md font-semibold mb-2"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            Words to Practice ({flagged.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {flagged.map((word, index) => (
              <span
                key={index}
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: `${statusConfig[word.status].color}20`,
                  color: statusConfig[word.status].color,
                }}
              >
                {word.word} → {word.said || 'missed'}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
