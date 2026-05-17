import { useState, useEffect } from 'react';
import { ProgressChart } from '../components/ProgressChart';
import * as api from '../services/api';
import type { ProgressResponse } from '../types';
import { Flame, Trophy, Calendar, BookOpen, AlertTriangle } from 'lucide-react';

export function ProgressPage() {
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = 'web-user-001'; // TODO: Get from auth context

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProgress(userId);
      setProgress(data);
    } catch (err) {
      setError('Could not load your progress. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="mb-8">
          <h1
            className="text-3xl md:text-4xl font-bold mb-2"
            style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
          >
            Your Progress
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '1.125rem' }}>
            Track your pronunciation journey
          </p>
        </div>
        <div className="skeleton" style={{ height: '2.5rem', width: '40%', marginBottom: '0.5rem' }} />
        <div className="skeleton" style={{ height: '1.25rem', width: '60%', marginBottom: '2rem' }} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card">
              <div className="skeleton" style={{ height: '1rem', width: '50%', marginBottom: '0.75rem' }} />
              <div className="skeleton" style={{ height: '2rem', width: '30%' }} />
            </div>
          ))}
        </div>
        <div className="card">
          <div className="skeleton" style={{ height: '300px', width: '100%' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="mb-8">
          <h1
            className="text-3xl md:text-4xl font-bold mb-2"
            style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
          >
            Your Progress
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '1.125rem' }}>
            Track your pronunciation journey
          </p>
        </div>
        <div
          className="toast-error flex items-center gap-3 p-4 rounded-lg"
          style={{ backgroundColor: 'var(--error-container)', color: 'var(--on-error-container)' }}
          role="alert"
        >
          <AlertTriangle size={20} aria-hidden="true" />
          <span className="flex-1">{error}</span>
          <button onClick={loadProgress} className="btn-secondary text-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="mb-8">
          <h1
            className="text-3xl md:text-4xl font-bold mb-2"
            style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
          >
            Your Progress
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '1.125rem' }}>
            Track your pronunciation journey
          </p>
        </div>
        <div className="card text-center" style={{ minHeight: '16rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <BookOpen size={48} style={{ color: 'var(--on-surface-variant)', opacity: 0.4, marginBottom: '1rem' }} aria-hidden="true" />
          <h3
            className="text-xl font-bold mb-2"
            style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
          >
            No progress data yet
          </h3>
          <p style={{ color: 'var(--on-surface-variant)', maxWidth: '24rem' }}>
            Complete your first practice session to start tracking your pronunciation improvement.
          </p>
        </div>
      </div>
    );
  }

  const chartData = progress.recent_sessions
    .map((session) => ({
      date: new Date(session.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      score: session.score,
    }))
    .reverse();

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1
          className="text-3xl md:text-4xl font-bold mb-2"
          style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
        >
          Your Progress
        </h1>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '1.125rem' }}>
          Track your pronunciation journey
        </p>
      </div>

      {/* Quick Stats Bar */}
      <div
        className="card mb-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 py-4 px-6"
        style={{
          borderLeft: '4px solid var(--accent)',
        }}
      >
        <div className="flex items-center gap-2">
          <Flame size={20} style={{ color: 'var(--accent)' }} aria-hidden="true" />
          <div>
            <p
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
            >
              {progress.streak_days}
            </p>
            <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
              Day Streak
            </p>
          </div>
        </div>

        <div
          className="hidden sm:block"
          style={{ width: '1px', height: '2rem', backgroundColor: 'var(--outline-variant)' }}
        />

        <div className="flex items-center gap-2">
          <Trophy size={20} style={{ color: 'var(--accent)' }} aria-hidden="true" />
          <div>
            <p
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
            >
              Level {progress.level}
            </p>
            <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
              Current Level
            </p>
          </div>
        </div>

        <div
          className="hidden sm:block"
          style={{ width: '1px', height: '2rem', backgroundColor: 'var(--outline-variant)' }}
        />

        <div className="flex items-center gap-2">
          <Calendar size={20} style={{ color: 'var(--accent)' }} aria-hidden="true" />
          <div>
            <p
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
            >
              {progress.total_sessions}
            </p>
            <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
              Sessions
            </p>
          </div>
        </div>
      </div>

      {/* Progress Chart & Stats */}
      <ProgressChart
        data={chartData}
        stats={{
          avgScore: progress.avg_score,
          totalSessions: progress.total_sessions,
          streakDays: progress.streak_days,
          wordsPracticed: progress.total_words_practiced,
        }}
      />

      {/* Recent Sessions Table */}
      {progress.recent_sessions.length > 0 && (
        <div className="card mt-8">
          <h3
            className="text-xl font-semibold mb-6"
            style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
          >
            Recent Practice Sessions
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full" role="table" aria-label="Recent practice sessions">
              <thead>
                <tr style={{ borderBottom: '2px solid var(--outline-variant)' }}>
                  <th
                    className="text-left text-xs font-semibold uppercase tracking-wider py-3 px-4"
                    style={{ color: 'var(--on-surface-variant)' }}
                  >
                    Date
                  </th>
                  <th
                    className="text-left text-xs font-semibold uppercase tracking-wider py-3 px-4"
                    style={{ color: 'var(--on-surface-variant)' }}
                  >
                    Sentence
                  </th>
                  <th
                    className="text-center text-xs font-semibold uppercase tracking-wider py-3 px-4"
                    style={{ color: 'var(--on-surface-variant)' }}
                  >
                    Score
                  </th>
                  <th
                    className="text-center text-xs font-semibold uppercase tracking-wider py-3 px-4"
                    style={{ color: 'var(--on-surface-variant)' }}
                  >
                    Grade
                  </th>
                  <th
                    className="text-center text-xs font-semibold uppercase tracking-wider py-3 px-4 hidden md:table-cell"
                    style={{ color: 'var(--on-surface-variant)' }}
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {progress.recent_sessions.map((session, index) => {
                  const getGradeColor = (grade: string) => {
                    if (grade.startsWith('A') || grade.startsWith('B'))
                      return 'var(--score-correct)';
                    if (grade.startsWith('C') || grade.startsWith('D'))
                      return 'var(--score-partial)';
                    return 'var(--score-incorrect)';
                  };

                  return (
                    <tr
                      key={index}
                      style={{ borderBottom: '1px solid var(--outline-variant)' }}
                    >
                      <td className="py-4 px-4 text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                        {new Date(session.timestamp).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 font-medium text-sm" style={{ color: 'var(--on-surface)' }}>
                        <span className="line-clamp-1">{session.target_sentence}</span>
                      </td>
                      <td className="py-4 px-4 text-center font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
                        {session.score}%
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: `${getGradeColor(session.grade)}15`,
                            color: getGradeColor(session.grade),
                          }}
                        >
                          {session.grade}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center hidden md:table-cell">
                        <button
                          className="text-sm font-medium hover:underline"
                          style={{ color: 'var(--accent)' }}
                          aria-label={`Retry sentence: ${session.target_sentence}`}
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}