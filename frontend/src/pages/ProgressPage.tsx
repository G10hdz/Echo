import { useEffect, useState } from 'react';
import { BookOpen, Flame, TrendingUp, Trophy } from 'lucide-react';
import { ProgressChart } from '../components/ProgressChart';
import * as api from '../services/api';
import type { ProgressResponse } from '../types';

const colorClass = (score: number) => score >= 80 ? 'hi' : score >= 60 ? 'mid' : 'lo';

export function ProgressPage() {
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [error, setError] = useState(false);
  const load = () => { setError(false); api.getProgress('web-user-001').then(setProgress).catch(() => setError(true)); };
  useEffect(load, []);
  if (error) return <div className="progress-page"><div className="page-head"><h1>Your progress</h1><p>Track the shape of your pronunciation.</p></div><div className="toast-error p-4" role="alert">Could not load progress. <button className="btn-secondary" onClick={load}>Retry</button></div></div>;
  if (!progress) return <div className="progress-page"><div className="page-head"><h1>Your progress</h1><p>Track the shape of your pronunciation.</p></div><div className="stat-bento">{[1, 2, 3, 4].map((item) => <div className="stat-cell" key={item}><div className="skeleton h-5 w-8" /><div className="skeleton h-8 w-16" /></div>)}</div></div>;
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const data = progress.recent_sessions.filter((session) => new Date(session.timestamp).getTime() >= sevenDaysAgo).map((session) => ({ date: new Date(session.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), score: session.score })).reverse();
  const stats = [
    { icon: Flame, value: progress.streak_days, label: 'day streak', accent: true },
    { icon: Trophy, value: `Level ${progress.level}`, label: 'practitioner' },
    { icon: BookOpen, value: progress.total_sessions, label: 'sessions' },
    { icon: TrendingUp, value: `${Math.round(progress.avg_score)}%`, label: 'average accuracy' },
  ];
  return <div className="progress-page"><div className="page-head"><h1>Your progress</h1><p>Track the shape of your pronunciation.</p></div><section className="stat-bento" aria-label="Progress summary">{stats.map(({ icon: Icon, value, label, accent }) => <div className={`stat-cell${accent ? ' accent' : ''}`} key={label}><span className="stat-cell__icon"><Icon size={17} /></span><strong>{value}</strong><span>{label}</span></div>)}</section><ProgressChart data={data} /><section><div className="section-header"><h2>Recent sessions</h2></div>{progress.recent_sessions.length ? <div className="session-grid">{progress.recent_sessions.map((session, index) => <article className="session-card" key={`${session.timestamp}-${index}`}><div><i className={colorClass(session.score)} /><strong>{session.target_sentence}</strong></div><small>{new Date(session.timestamp).toLocaleDateString()}</small><p><span><b className={colorClass(session.score)} style={{ width: `${session.score}%` }} /></span><em>{Math.round(session.score)}%</em></p></article>)}</div> : <div className="fresco-empty">Your completed sessions will appear here.</div>}</section></div>;
}
