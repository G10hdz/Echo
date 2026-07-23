import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Flame, Star } from 'lucide-react';
import * as api from '../services/api';
import type { ProgressResponse } from '../types';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'zh', label: '中文' },
];

export function HomePage() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProgress('web-user-001').then(setProgress).catch(() => undefined).finally(() => setLoading(false));
  }, []);

  const sessions = progress?.recent_sessions ?? [];
  const todaySessions = sessions.filter((session) => new Date(session.timestamp).toDateString() === new Date().toDateString());
  const accuracy = Math.round(progress?.avg_score ?? 0);
  const scoreClass = (score: number) => score >= 80 ? 'hi' : score >= 60 ? 'mid' : 'lo';

  return (
    <div className="page fresco-home">
      <section className="fresco-hero">
        <div className="fresco-hero-main">
          <h1>Ready when you are.</h1>
          <p>Your ear already knows the shape. Give it two minutes.</p>
          <button className="fresco-cta" onClick={() => navigate(language === 'zh' ? '/practice/zh' : '/practice')}>
            Practice now <span><ArrowRight size={15} /></span>
          </button>
          <div className="fresco-languages" role="group" aria-label="Practice language">
            {languages.map((item) => <button key={item.code} aria-pressed={language === item.code} onClick={() => setLanguage(item.code)}>{item.label}{item.code === 'zh' && <small>BETA</small>}</button>)}
          </div>
        </div>
        <aside className="fresco-stats" aria-label="Your progress">
          <div className="fresco-level"><b>{loading ? '...' : progress?.level ?? 'A1'}</b><span>Current level</span></div>
          <div className="fresco-goal"><div className="fresco-ring">{loading ? '...' : `${Math.min(100, todaySessions.length * 25)}%`}</div><div><strong>Daily goal</strong><p>{Math.min(4, todaySessions.length)} of 4 sessions complete</p></div></div>
          <div className="fresco-mini-stats"><div><strong>{loading ? '...' : progress?.streak_days ?? 0}</strong><span>day streak</span></div><div><strong>{loading ? '...' : `${accuracy}%`}</strong><span>accuracy</span></div><div><strong>{loading ? '...' : progress?.total_words_practiced ?? 0}</strong><span>words</span></div></div>
        </aside>
      </section>

      <section>
        <div className="fresco-section-title"><h2>Recent sessions</h2></div>
        {sessions.length ? <div className="fresco-session-grid">
          {sessions.slice(0, 4).map((session, index) => <article className="fresco-session" key={`${session.timestamp}-${index}`}>
            <div><i className={scoreClass(session.score)} /><strong>{session.target_sentence}</strong></div>
            <small>{new Date(session.timestamp).toLocaleDateString()}</small>
            <div className="fresco-score"><span><b className={scoreClass(session.score)} style={{ width: `${session.score}%` }} /></span><em>{Math.round(session.score)}%</em></div>
          </article>)}
        </div> : <div className="fresco-empty">Your completed sessions will appear here.</div>}
      </section>

      <section className="fresco-achievement"><span><Star size={17} fill="currentColor" /></span><div><strong>Keep the rhythm</strong><p>Complete one more session to reach today's goal.</p></div><div className="fresco-achievement-progress"><b><i /></b><small><Flame size={12} fill="currentColor" /> {loading ? '...' : progress?.streak_days ?? 0} day streak</small></div></section>
    </div>
  );
}
