import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProgressChart } from '../components/ProgressChart';
import * as api from '../services/api';
import type { ProgressResponse } from '../types';
import { Flame, Trophy, Calendar, BookOpen, AlertTriangle } from 'lucide-react';

/* Header único reutilizado por los 4 estados de la página (bug V21). */
function PageHeader() {
  return (
    <div className="mb-8">
      <h1
        className="text-3xl md:text-4xl font-bold mb-2"
        style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
      >
        Tu progreso
      </h1>
      <p style={{ color: 'var(--on-surface-variant)', fontSize: '1.125rem' }}>
        Sigue la evolución de tu pronunciación
      </p>
    </div>
  );
}

function gradeColors(grade: string): { bg: string; fg: string } {
  if (grade.startsWith('A') || grade.startsWith('B'))
    return { bg: 'var(--score-correct-bg)', fg: 'var(--score-correct)' };
  if (grade.startsWith('C') || grade.startsWith('D'))
    return { bg: 'var(--score-partial-bg)', fg: 'var(--score-partial)' };
  return { bg: 'var(--score-incorrect-bg)', fg: 'var(--score-incorrect)' };
}

export function ProgressPage() {
  const navigate = useNavigate();
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
    } catch {
      setError('No se pudo cargar tu progreso. Inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto px-4 md:px-8 py-8 md:py-12">
        <PageHeader />
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
      <div className="mx-auto px-4 md:px-8 py-8 md:py-12">
        <PageHeader />
        <div
          className="toast-error flex items-center gap-3 p-4 rounded-lg"
          style={{ backgroundColor: 'var(--error-container)', color: 'var(--on-error-container)' }}
          role="alert"
        >
          <AlertTriangle size={20} aria-hidden="true" />
          <span className="flex-1">{error}</span>
          <button onClick={loadProgress} className="btn-secondary text-sm">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="mx-auto px-4 md:px-8 py-8 md:py-12">
        <PageHeader />
        <div className="card text-center" style={{ minHeight: '16rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <BookOpen size={48} style={{ color: 'var(--on-surface-variant)', opacity: 0.4, marginBottom: '1rem' }} aria-hidden="true" />
          <h3
            className="text-xl font-bold mb-2"
            style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
          >
            Aún no hay datos de progreso
          </h3>
          <p style={{ color: 'var(--on-surface-variant)', maxWidth: '24rem', marginBottom: '1.5rem' }}>
            Completa tu primera sesión de práctica para empezar a registrar tu mejora.
          </p>
          <button onClick={() => navigate('/practice')} className="btn-primary">
            Ir a practicar
          </button>
        </div>
      </div>
    );
  }

  const chartData = progress.recent_sessions
    .map((session) => ({
      date: new Date(session.timestamp).toLocaleDateString('es-ES', {
        month: 'short',
        day: 'numeric',
      }),
      score: session.score,
    }))
    .reverse();

  return (
    <div className="mx-auto px-4 md:px-8 py-8 md:py-12">
      <PageHeader />

      {/* Barra de stats rápidas */}
      <div
        className="card mb-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 py-4 px-6"
        style={{
          borderLeft: '4px solid var(--primary)',
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
              Días de racha
            </p>
          </div>
        </div>

        <div
          className="hidden sm:block"
          style={{ width: '1px', height: '2rem', backgroundColor: 'var(--outline-variant)' }}
        />

        <div className="flex items-center gap-2">
          <Trophy size={20} style={{ color: 'var(--primary)' }} aria-hidden="true" />
          <div>
            <p
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
            >
              Nivel {progress.level}
            </p>
            <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
              Nivel actual
            </p>
          </div>
        </div>

        <div
          className="hidden sm:block"
          style={{ width: '1px', height: '2rem', backgroundColor: 'var(--outline-variant)' }}
        />

        <div className="flex items-center gap-2">
          <Calendar size={20} style={{ color: 'var(--primary)' }} aria-hidden="true" />
          <div>
            <p
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
            >
              {progress.total_sessions}
            </p>
            <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
              Sesiones
            </p>
          </div>
        </div>
      </div>

      {/* Gráfica + stats */}
      <ProgressChart
        data={chartData}
        stats={{
          avgScore: progress.avg_score,
          totalSessions: progress.total_sessions,
          streakDays: progress.streak_days,
          wordsPracticed: progress.total_words_practiced,
        }}
      />

      {/* Sesiones recientes */}
      {progress.recent_sessions.length > 0 && (
        <div className="card mt-8">
          <h3
            className="text-xl font-semibold mb-6"
            style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
          >
            Sesiones recientes
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full" role="table" aria-label="Sesiones de práctica recientes">
              <thead>
                <tr style={{ borderBottom: '2px solid var(--outline-variant)' }}>
                  <th
                    className="text-left text-xs font-semibold uppercase tracking-wider py-3 px-4"
                    style={{ color: 'var(--on-surface-variant)' }}
                  >
                    Fecha
                  </th>
                  <th
                    className="text-left text-xs font-semibold uppercase tracking-wider py-3 px-4"
                    style={{ color: 'var(--on-surface-variant)' }}
                  >
                    Frase
                  </th>
                  <th
                    className="text-center text-xs font-semibold uppercase tracking-wider py-3 px-4"
                    style={{ color: 'var(--on-surface-variant)' }}
                  >
                    Puntuación
                  </th>
                  <th
                    className="text-center text-xs font-semibold uppercase tracking-wider py-3 px-4"
                    style={{ color: 'var(--on-surface-variant)' }}
                  >
                    Nota
                  </th>
                  <th
                    className="text-center text-xs font-semibold uppercase tracking-wider py-3 px-4 hidden md:table-cell"
                    style={{ color: 'var(--on-surface-variant)' }}
                  >
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody>
                {progress.recent_sessions.map((session) => {
                  const colors = gradeColors(session.grade);

                  return (
                    <tr
                      key={session.timestamp}
                      style={{ borderBottom: '1px solid var(--outline-variant)' }}
                    >
                      <td className="py-4 px-4 text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                        {new Date(session.timestamp).toLocaleDateString('es-ES')}
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
                            backgroundColor: colors.bg,
                            color: colors.fg,
                          }}
                        >
                          {session.grade}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center hidden md:table-cell">
                        <button
                          onClick={() => navigate('/practice')}
                          className="text-sm font-medium hover:underline"
                          style={{
                            color: 'var(--primary)',
                            minHeight: 'var(--touch-target)',
                            padding: '0 0.5rem',
                          }}
                          aria-label={`Volver a practicar la frase: ${session.target_sentence}`}
                        >
                          Practicar
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
