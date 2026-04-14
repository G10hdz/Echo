// Progress dashboard page

import { useState, useEffect } from 'react';
import { ProgressChart } from '../components/ProgressChart';
import * as api from '../services/api';
import type { ProgressResponse } from '../types';
import { Flame, Loader2, Calendar, Trophy } from 'lucide-react';

export function ProgressPage() {
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = 'web-user-001'; // TODO: Get from auth context

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    setLoading(true);
    try {
      const data = await api.getProgress(userId);
      setProgress(data);
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 size={48} className="animate-spin" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="card text-center">
          <p className="text-lg" style={{ color: 'var(--on-surface-variant)' }}>
            No progress data available yet. Start practicing to see your progress!
          </p>
        </div>
      </div>
    );
  }

  // Generate chart data from recent sessions
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
    <div className="max-w-7xl mx-auto px-8 py-12">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1
          className="text-4xl font-bold mb-2"
          style={{ fontFamily: 'var(--font-headline)' }}
        >
          Welcome back! 👋
        </h1>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '1.125rem' }}>
          Here's your pronunciation practice journey
        </p>
      </div>

      {/* Quick Stats Bar */}
      <div
        className="card mb-8 flex items-center justify-between flex-wrap gap-4"
        style={{
          background: 'linear-gradient(135deg, var(--primary), var(--primary-container))',
          color: 'var(--on-primary)',
        }}
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Flame size={24} />
            <div>
              <p className="text-2xl font-bold">{progress.streak_days}</p>
              <p className="text-sm opacity-80">Day Streak</p>
            </div>
          </div>

          <div className="w-px h-12 bg-white/20" />

          <div className="flex items-center gap-2">
            <Trophy size={24} />
            <div>
              <p className="text-2xl font-bold">Level {progress.level}</p>
              <p className="text-sm opacity-80">Current Level</p>
            </div>
          </div>

          <div className="w-px h-12 bg-white/20" />

          <div className="flex items-center gap-2">
            <Calendar size={24} />
            <div>
              <p className="text-2xl font-bold">{progress.total_sessions}</p>
              <p className="text-sm opacity-80">Sessions</p>
            </div>
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
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            Recent Practice Sessions
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--surface-container-low)',
                  }}
                >
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Target Sentence</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Score</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Grade</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Action</th>
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
                      className="border-b"
                      style={{
                        borderColor: 'var(--surface-container)',
                      }}
                    >
                      <td className="px-4 py-4 text-sm">
                        {new Date(session.timestamp).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 font-medium">{session.target_sentence}</td>
                      <td className="px-4 py-4 text-center text-lg font-bold">
                        {session.score}%
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className="px-3 py-1 rounded-full text-sm font-semibold"
                          style={{
                            backgroundColor: `${getGradeColor(session.grade)}20`,
                            color: getGradeColor(session.grade),
                          }}
                        >
                          {session.grade}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button className="text-sm font-medium hover:underline" style={{ color: 'var(--primary)' }}>
                          Practice Again
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
