import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Play, RotateCcw } from 'lucide-react';
import type { ScoreResponse } from '../types';

interface ResultsState { score: ScoreResponse; sentence: string; }

const wordStyle = (status: ScoreResponse['words'][number]['status']) => ({
  correct: 'hi', partial: 'mid', incorrect: 'lo', missed: 'missed', extra: 'missed',
}[status]);

export function ResultsPage() {
  const navigate = useNavigate();
  const state = useLocation().state as ResultsState | null;
  if (!state?.score) return <div className="results-page results-empty"><p>No session data. Start a practice session first.</p><button className="btn-primary" onClick={() => navigate('/practice')}>Go to Practice</button></div>;
  const { score, sentence } = state;
  const percent = Math.round(score.overall_score);
  const circumference = 2 * Math.PI * 54;
  const correct = score.words.filter((word) => word.status === 'correct').length;
  return <div className="results-page"><p className="session-meta">Session complete - today</p><section className="doppel" aria-label="Session score"><div className="doppel__inner"><div className="score-ring"><svg viewBox="0 0 140 140"><circle cx="70" cy="70" r="54" fill="none" stroke="var(--border-light)" strokeWidth="8" /><motion.circle cx="70" cy="70" r="54" fill="none" stroke="var(--teal)" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: circumference - (percent / 100) * circumference }} transition={{ duration: 1.2 }} /></svg><div><strong>{percent}%</strong><span>{score.grade}</span></div></div><p className="target-sentence"><Play size={16} fill="currentColor" />{sentence}</p></div></section><div className="result-mini-stats"><div><strong>{score.words.length}</strong><span>words</span></div><div><strong>{correct}</strong><span>correct</span></div><div><strong>{score.flagged.length}</strong><span>flagged</span></div></div><section className="breakdown-card"><h2>Word breakdown</h2><div>{score.words.map((word, index) => <span className={`word-pill ${wordStyle(word.status)}`} key={`${word.word}-${index}`}>{word.word}</span>)}</div></section><div className="result-actions"><button className="btn-primary" onClick={() => navigate('/practice')}><RotateCcw size={17} />Practice again</button><button className="btn-secondary" onClick={() => navigate('/')}><Home size={17} />Home</button></div></div>;
}
