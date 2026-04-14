// Sidebar navigation component

import { Mic, BarChart3, Settings, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  userName?: string;
  streakDays?: number;
}

export function Sidebar({ userName = 'User', streakDays = 7 }: SidebarProps) {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Mic, label: 'Practice' },
    { path: '/progress', icon: BarChart3, label: 'Progress' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col"
      style={{
        width: '280px',
        backgroundColor: 'var(--surface-container-low)',
      }}
    >
      {/* User Profile */}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, var(--primary), var(--primary-container))',
            }}
          >
            <User size={24} style={{ color: 'var(--on-primary)' }} />
          </div>
          <div>
            <p
              className="font-semibold"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              {userName}
            </p>
            <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
              Free Plan
            </p>
          </div>
        </div>

        {/* Streak Badge */}
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-lg"
          style={{
            backgroundColor: 'var(--surface-container-lowest)',
          }}
        >
          <span className="text-xl">🔥</span>
          <span className="font-semibold">{streakDays} days</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all"
              style={{
                backgroundColor: isActive ? 'var(--surface-container-high)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--on-surface)',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 text-center text-sm" style={{ color: 'var(--on-surface-variant)' }}>
        Echo v0.1.0
      </div>
    </aside>
  );
}
