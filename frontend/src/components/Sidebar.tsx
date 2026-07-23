import { Flame, Moon, Sun } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

export function Sidebar({ streakDays }: { streakDays?: number }) {
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <header className="topbar-wrap">
      <nav className="topbar" aria-label="Main navigation">
        <div className="topbar-left">
          <Link className="wordmark" to="/">ECHO</Link>
          <div className="topbar-nav">
            {[['/', 'Home'], ['/practice', 'Practice'], ['/progress', 'Progress']].map(([to, label]) => (
              <Link key={to} to={to} aria-current={location.pathname === to ? 'page' : undefined}>{label}</Link>
            ))}
          </div>
        </div>
        <div className="topbar-right">
          {streakDays !== undefined && <span className="streak-badge" aria-label={`${streakDays} day streak`}><Flame size={14} fill="currentColor" />{streakDays}</span>}
          <button className="theme-toggle" onClick={toggleDarkMode} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </nav>
    </header>
  );
}
