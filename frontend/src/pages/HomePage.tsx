import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, Moon, Sun, ArrowRight, ChevronRight, AlertTriangle, Star } from 'lucide-react';
import * as api from '../services/api';
import type { ProgressResponse, LanguageCode } from '../types';
import { useTheme } from '../contexts/ThemeContext';

const LANGUAGES: Array<{ code: LanguageCode; label: string; beta?: boolean }> = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'zh', label: '中文', beta: true },
];

/* 2π·r con r=30 — debe coincidir con stroke-dasharray de .ring-fill en index.css */
const RING_CIRCUMFERENCE = 188.5;

function scoreTier(score: number): 'hi' | 'mid' | 'lo' {
  if (score >= 80) return 'hi';
  if (score >= 60) return 'mid';
  return 'lo';
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 7 || h >= 21) return 'Buenas noches.';
  if (h < 13) return 'Buenos días.';
  return 'Buenas tardes.';
}

const dateFmt = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

function initialLanguage(): LanguageCode {
  const saved = api.loadSettings().language;
  return LANGUAGES.some((l) => l.code === saved) ? saved : 'en';
}

export function HomePage() {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  const [language, setLanguage] = useState<LanguageCode>(initialLanguage);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    api
      .getProgress('web-user-001')
      .then((data) => {
        if (!cancelled) setProgress(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  /* Dispara las transiciones CSS (ring, barras) tras montar con datos */
  useEffect(() => {
    if (!progress) return;
    const t = setTimeout(() => setAnimate(true), 300);
    return () => clearTimeout(t);
  }, [progress]);

  const startPractice = useCallback(() => {
    api.saveSettings({ ...api.loadSettings(), language });
    navigate(language === 'zh' ? '/practice/zh' : '/practice');
  }, [language, navigate]);

  const streak = progress?.streak_days ?? 0;
  const accuracy = Math.min(100, Math.max(0, progress?.avg_score ?? 0));
  const wordsMastered = progress?.total_words_practiced ?? 0;
  const totalSessions = progress?.total_sessions ?? 0;
  const level = progress?.level ?? '—';
  const sessions = progress?.recent_sessions ?? [];

  /* Próximo hito de racha: siguiente múltiplo de 5 por encima de la racha actual */
  const streakGoal = Math.max(5, Math.ceil((streak + 1) / 5) * 5);
  const streakPct = Math.min(100, Math.round((streak / streakGoal) * 100));

  return (
    <div className="pb-16">
      {/* Topbar: Fluid Island */}
      <div className="topbar-wrap">
        <header className="topbar">
          <Link className="wordmark" to="/">
            ECHO
          </Link>
          <div className="topbar-right">
            <div className="streak-badge" aria-label={`Racha de ${streak} días`}>
              <Flame size={14} aria-hidden="true" />
              <span>{loading ? '—' : streak}</span>
            </div>
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleDarkMode}
              aria-label={darkMode ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            >
              {darkMode ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
            </button>
          </div>
        </header>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-6 flex flex-col gap-10">
        {/* Hero: bloque teal sólido + stats panel */}
        <section className="hero">
          <div className="hero-main">
            <h1>{greeting()}</h1>
            <p className="hero-sub">Tu oído ya sabe lo que toca. Dos minutos y lo tienes.</p>
            <div className="cta-group">
              <button type="button" className="btn-primary" onClick={startPractice}>
                <span>Practicar ahora</span>
                <span className="btn-icon-wrap" aria-hidden="true">
                  <ArrowRight size={14} />
                </span>
              </button>
            </div>
            <div className="lang-strip" role="group" aria-label="Idioma de práctica">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  aria-pressed={language === lang.code}
                  onClick={() => setLanguage(lang.code)}
                >
                  {lang.label}
                  {lang.beta && <span className="beta-tag">BETA</span>}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="stats-panel" aria-hidden="true">
              <div className="skeleton" style={{ height: '3rem', borderRadius: 'var(--radius-full)' }} />
              <div className="skeleton" style={{ height: '7.5rem', borderRadius: 'var(--radius-xl)' }} />
              <div className="skeleton" style={{ height: '4.5rem' }} />
            </div>
          ) : error ? (
            <div className="stats-panel">
              <div className="card" role="alert">
                <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--fg)' }}>
                  <AlertTriangle size={16} style={{ color: 'var(--score-lo)' }} aria-hidden="true" />
                  No se pudieron cargar tus datos
                </p>
                <p className="text-sm mt-1 mb-4" style={{ color: 'var(--muted)' }}>
                  Comprueba tu conexión e inténtalo de nuevo.
                </p>
                <button type="button" className="btn-secondary" onClick={() => setRetryCount((n) => n + 1)}>
                  Reintentar
                </button>
              </div>
            </div>
          ) : (
            <div className="stats-panel">
              <div className="level-badge">
                <span className="level-badge__icon">{level}</span>
                <span className="level-badge__text">Nivel actual</span>
                <span className="level-badge__xp">{totalSessions} sesiones</span>
              </div>

              <div className="doppel">
                <div className="doppel__inner">
                  <div className="ring-card">
                    <div className="ring-wrap">
                      <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
                        <circle className="ring-bg" cx="36" cy="36" r="30" fill="none" strokeWidth="4" />
                        <circle
                          className="ring-fill"
                          cx="36"
                          cy="36"
                          r="30"
                          fill="none"
                          strokeWidth="4"
                          style={{
                            strokeDashoffset: animate
                              ? RING_CIRCUMFERENCE * (1 - accuracy / 100)
                              : RING_CIRCUMFERENCE,
                          }}
                        />
                      </svg>
                      <span className="ring-num">{Math.round(accuracy)}%</span>
                    </div>
                    <div className="ring-copy">
                      <div className="ring-copy__title">Precisión media</div>
                      <div className="ring-copy__sub">
                        {totalSessions === 1 ? '1 sesión completada' : `${totalSessions} sesiones completadas`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mini-stats">
                <div className="mini-stat">
                  <div className="mini-stat__num">{streak}</div>
                  <div className="mini-stat__label">racha</div>
                </div>
                <div className="mini-stat">
                  <div className="mini-stat__num">{Math.round(accuracy)}%</div>
                  <div className="mini-stat__label">precisión</div>
                </div>
                <div className="mini-stat">
                  <div className="mini-stat__num">{wordsMastered}</div>
                  <div className="mini-stat__label">palabras</div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Sesiones recientes */}
        <section aria-labelledby="recents-label">
          <div className="section-header">
            <h2 id="recents-label">Sesiones recientes</h2>
          </div>

          {loading ? (
            <div className="session-grid" aria-hidden="true">
              {['sk-a', 'sk-b', 'sk-c', 'sk-d'].map((k) => (
                <div key={k} className="skeleton" style={{ height: '6.5rem' }} />
              ))}
            </div>
          ) : error ? null : sessions.length === 0 ? (
            <div className="card text-center">
              <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
                Aún no tienes sesiones — empieza tu primera práctica.
              </p>
              <button type="button" className="btn-primary" onClick={startPractice}>
                Empezar práctica
              </button>
            </div>
          ) : (
            <div className="session-grid">
              {sessions.slice(0, 4).map((session) => (
                <div className="session-card" key={`${session.timestamp}-${session.target_sentence}`}>
                  <Link
                    to="/progress"
                    aria-label={`Ver progreso — sesión «${session.target_sentence}», ${Math.round(session.score)}%`}
                  >
                    <div className="s-card__head">
                      <span className={`score-dot ${scoreTier(session.score)}`} aria-hidden="true" />
                      <span
                        className={`s-card__sent${/[一-鿿]/.test(session.target_sentence) ? ' lang-zh' : ''}`}
                      >
                        {session.target_sentence}
                      </span>
                    </div>
                    <span className="s-card__meta">{dateFmt.format(new Date(session.timestamp))}</span>
                    <div className="s-card__score-row">
                      <div className="s-card__bar">
                        <div
                          className={`s-card__fill ${scoreTier(session.score)}${animate ? ' anim' : ''}`}
                          style={{ '--fill': `${Math.round(session.score)}%` } as CSSProperties}
                        />
                      </div>
                      <span className="s-card__score">{Math.round(session.score)}</span>
                    </div>
                    <ChevronRight className="s-card__arrow" size={16} aria-hidden="true" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Achievement strip (único acento ámbar además del streak badge) */}
        {!loading && !error && (
          <div className="achievement">
            <div className="achieve__head">
              <span className="achieve__icon" aria-hidden="true">
                <Star size={14} fill="currentColor" stroke="none" />
              </span>
              <span className="achieve__title">Próximo logro: {streakGoal} días seguidos</span>
            </div>
            <div className="achieve__bar">
              <div className="achieve__fill" style={{ width: animate ? `${streakPct}%` : '0%' }} />
            </div>
            <span className="achieve__label">
              {streak} / {streakGoal} días · {streakPct}% completado
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
