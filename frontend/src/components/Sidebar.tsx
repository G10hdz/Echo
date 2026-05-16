import { useState } from 'react';
import { Home, Mic, BarChart3, Settings, User, Menu, X, Flame, Moon, Sun } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

interface SidebarProps {
  userName?: string;
  streakDays?: number;
}

export function Sidebar({ userName = 'User', streakDays = 0 }: SidebarProps) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/practice', icon: Mic, label: 'Practice' },
    { path: '/progress', icon: BarChart3, label: 'Progress' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const sidebarContent = (
    <>
      <a href="#main-content" className="skip-nav">
        Skip to main content
      </a>

      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: 'var(--accent-container)',
            }}
          >
            <User size={20} style={{ color: 'var(--on-accent-container)' }} />
          </div>
          <div>
            <p
              className="font-semibold text-sm"
              style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
            >
              {userName}
            </p>
            <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
              Free Plan
            </p>
          </div>
        </div>

        {streakDays > 0 && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg mb-6"
            style={{
              backgroundColor: 'var(--surface-container)',
            }}
          >
            <Flame size={16} style={{ color: 'var(--accent)' }} />
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--on-surface)' }}
            >
              {streakDays} day streak
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 px-4" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all"
              style={{
                backgroundColor: isActive ? 'var(--surface-container-high)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--on-surface)',
                fontWeight: isActive ? 600 : 400,
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={20} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pb-4">
        <button
          onClick={() => {
            toggleDarkMode();
            setMobileOpen(false);
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-all"
          style={{
            color: 'var(--on-surface)',
          }}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
          <span>{darkMode ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </div>

      <div className="p-4 text-center" style={{ color: 'var(--on-surface-variant)' }}>
        <p className="text-xs" style={{ fontFamily: 'var(--font-body)', opacity: 0.6 }}>
          Echo v0.1.0
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-lg md:hidden"
        style={{
          backgroundColor: 'var(--surface-container-lowest)',
          border: '1px solid var(--outline-variant)',
          boxShadow: 'var(--shadow-sm)',
        }}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — desktop: fixed, mobile: overlay */}
      <aside
        className="fixed left-0 top-0 h-screen flex flex-col z-40 transition-transform duration-300 md:translate-x-0"
        style={{
          width: 'var(--sidebar-width)',
          maxWidth: '260px',
          backgroundColor: 'var(--surface-container-low)',
          borderRight: '1px solid var(--outline-variant)',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
        role="navigation"
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar is always visible */}
      <style>{`
        @media (min-width: 769px) {
          aside[role='navigation'] {
            transform: translateX(0) !important;
          }
        }
      `}</style>
    </>
  );
}