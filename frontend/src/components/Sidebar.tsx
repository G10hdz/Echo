import { useState } from 'react';
import { Home, Mic, BarChart3, Settings, Menu, X, Flame, Moon, Sun, Languages } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

interface SidebarProps {
  userName?: string;
  streakDays?: number;
}

export function Sidebar({ userName, streakDays = 0 }: SidebarProps) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();

  const navItems = [
    { path: '/', icon: Home, label: 'Inicio' },
    { path: '/practice', icon: Mic, label: 'Práctica' },
    { path: '/practice/zh', icon: Languages, label: '中文 Práctica' },
    { path: '/progress', icon: BarChart3, label: 'Progreso' },
    { path: '/settings', icon: Settings, label: 'Configuración' },
  ];

  const sidebarContent = (
    <>
      <a href="#main-content" className="skip-nav">
        Saltar al contenido principal
      </a>

      <div className="p-6">
        <Link
          to="/"
          className="wordmark"
          onClick={() => setMobileOpen(false)}
        >
          ECHO
        </Link>

        {userName && (
          <p
            className="mt-2 text-sm font-medium"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            {userName}
          </p>
        )}

        {streakDays > 0 && (
          <div className="mt-4 flex">
            <div
              className="streak-badge"
              aria-label={`Racha de ${streakDays} ${streakDays === 1 ? 'día' : 'días'}`}
            >
              <Flame aria-hidden="true" />
              <span>
                {streakDays} {streakDays === 1 ? 'día' : 'días'}
              </span>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-4" aria-label="Navegación principal">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 rounded-lg mb-1 transition-all"
              style={{
                minHeight: 'var(--touch-target)',
                backgroundColor: isActive ? 'var(--primary-container)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)',
                fontWeight: isActive ? 600 : 500,
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
          className="flex items-center gap-3 px-4 rounded-lg w-full transition-all"
          style={{
            minHeight: 'var(--touch-target)',
            color: 'var(--on-surface-variant)',
          }}
          aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {darkMode ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
          <span>{darkMode ? 'Modo claro' : 'Modo oscuro'}</span>
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
      {/* Botón hamburguesa móvil (≥44px) */}
      <button
        className="fixed top-4 left-4 z-50 rounded-lg md:hidden flex items-center justify-center"
        style={{
          width: 'var(--touch-target)',
          height: 'var(--touch-target)',
          backgroundColor: 'var(--surface-container-lowest)',
          border: '1px solid var(--outline-variant)',
          boxShadow: 'var(--shadow-sm)',
          color: 'var(--on-surface)',
        }}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Cerrar navegación' : 'Abrir navegación'}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
      </button>

      {/* Overlay móvil */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — desktop: fijo; móvil: drawer de 280px (--sidebar-width en <768px).
          El CSS global (index.css, ≥768px) fuerza translateX(0) en desktop. */}
      <aside
        className="fixed left-0 top-0 h-screen flex flex-col z-40 md:translate-x-0"
        style={{
          width: 'var(--sidebar-width)',
          backgroundColor: 'var(--surface-container-low)',
          borderRight: '1px solid var(--outline-variant)',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform var(--transition-normal)',
        }}
        role="navigation"
        aria-label="Barra lateral"
      >
        {sidebarContent}
      </aside>
    </>
  );
}
