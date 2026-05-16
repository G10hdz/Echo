import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Globe, TrendingUp, Target, BookOpen, ChevronRight } from 'lucide-react';
import * as api from '../services/api';
import type { ProgressResponse } from '../types';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
];

export function HomePage() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getProgress('web-user-001');
        setProgress(data);
      } catch {
        // Stats unavailable — show zeros
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const streak = progress?.streak_days ?? 0;
  const sessionsToday = progress?.recent_sessions?.filter(
    (s) => new Date(s.timestamp).toDateString() === new Date().toDateString()
  ).length ?? 0;
  const accuracy = progress?.avg_score ?? 0;
  const wordsMastered = progress?.total_words_practiced ?? 0;

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 md:py-12">
      {/* Terminal label */}
      <motion.p
        className="text-xs tracking-[0.2em] uppercase mb-8 opacity-60"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--on-surface-variant)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 0.6 }}
      >
        {'> ECHO // PRONUNCIATION INTELLIGENCE'}
      </motion.p>

      {/* Streak + CTA hero */}
      <motion.div
        className="card text-center py-10 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Streak */}
        <div className="mb-6">
          <p
            className="text-6xl font-bold mb-1"
            style={{ fontFamily: 'var(--font-headline)', color: 'var(--primary)' }}
          >
            {loading ? '—' : streak}
          </p>
          <p className="text-sm uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
            Day Streak
          </p>
        </div>

        {/* Language selector */}
        <div className="flex justify-center gap-2 mb-8">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                backgroundColor: language === lang.code ? 'var(--primary)' : 'transparent',
                color: language === lang.code ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                border: language === lang.code ? 'none' : '1px solid var(--ghost-border)',
                boxShadow: language === lang.code ? 'var(--shadow-glow)' : 'none',
              }}
            >
              <Globe size={14} className="inline mr-1" />
              {lang.label}
            </button>
          ))}
        </div>

        {/* Start CTA */}
        <motion.button
          onClick={() => navigate('/practice')}
          className="inline-flex items-center gap-3 px-8 py-4 rounded-xl text-lg font-bold"
          style={{
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            color: 'white',
            boxShadow: 'var(--shadow-lg)',
          }}
          whileHover={{ scale: 1.03, boxShadow: '0 12px 40px rgba(107, 91, 166, 0.3)' }}
          whileTap={{ scale: 0.97 }}
        >
          <Play size={22} fill="white" />
          START SESSION
        </motion.button>
      </motion.div>

      {/* Stats row */}
      <motion.div
        className="grid grid-cols-3 gap-4 mb-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {[
          { label: 'Sessions Today', value: loading ? '—' : sessionsToday, icon: Target },
          { label: 'Accuracy', value: loading ? '—' : `${Math.round(accuracy)}%`, icon: TrendingUp },
          { label: 'Words Mastered', value: loading ? '—' : wordsMastered, icon: BookOpen },
        ].map((stat) => (
          <div
            key={stat.label}
            className="card text-center py-5"
            style={{
              backgroundColor: 'var(--glass-bg)',
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--glass-border)',
            }}
          >
            <stat.icon size={20} className="mx-auto mb-2" style={{ color: 'var(--primary)' }} />
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

      {/* Recent Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
      >
        <h2
          className="text-sm uppercase tracking-widest mb-4"
          style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface-variant)' }}
        >
          Recent Sessions
        </h2>

        {!progress?.recent_sessions?.length ? (
          <div className="card py-8 text-center" style={{ color: 'var(--on-surface-variant)' }}>
            <p className="text-sm">No sessions yet. Start practicing!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {progress.recent_sessions.slice(0, 5).map((session, i) => (
              <motion.div
                key={i}
                className="card flex items-center gap-4 py-3 px-4 cursor-pointer"
                style={{ border: '1px solid var(--ghost-border)' }}
                whileHover={{ x: 4, backgroundColor: 'var(--surface-container-low)' }}
              >
                <span className="text-lg">
                  {language === 'es' ? '🇪🇸' : '🇺🇸'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--on-surface)' }}>
                    {session.target_sentence}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                    {new Date(session.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className="px-2 py-1 rounded text-xs font-bold"
                  style={{
                    backgroundColor: session.score >= 80 ? 'var(--score-correct-bg)' : session.score >= 60 ? 'var(--score-partial-bg)' : 'var(--score-incorrect-bg)',
                    color: session.score >= 80 ? 'var(--score-correct)' : session.score >= 60 ? 'var(--score-partial)' : 'var(--score-incorrect)',
                  }}
                >
                  {session.score}%
                </span>
                <ChevronRight size={16} style={{ color: 'var(--on-surface-variant)' }} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
