import type { Config } from 'tailwindcss'

/* Echo Design System — Teal Tech (design/brand-spec.md) */
/* Los colores apuntan a las CSS custom properties de src/index.css, */
/* de modo que el tema (light/dark) se resuelve en runtime.          */

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Tokens base
        teal: {
          DEFAULT: 'var(--teal)',
          dim: 'var(--teal-dim)',
          hover: 'var(--teal-hover)',
        },
        amber: {
          DEFAULT: 'var(--amber)',
          hover: 'var(--amber-hover)',
        },
        bg: 'var(--bg)',
        surface: {
          DEFAULT: 'var(--surface)',
          elevated: 'var(--surface-elevated)',
        },
        fg: 'var(--fg)',
        muted: 'var(--muted)',
        border: {
          DEFAULT: 'var(--border)',
          light: 'var(--border-light)',
        },
        // Semánticos de score (spec)
        score: {
          hi: 'var(--score-hi)',
          mid: 'var(--score-mid)',
          lo: 'var(--score-lo)',
          // Aliases legacy
          correct: 'var(--score-correct)',
          'correct-bg': 'var(--score-correct-bg)',
          partial: 'var(--score-partial)',
          'partial-bg': 'var(--score-partial-bg)',
          incorrect: 'var(--score-incorrect)',
          'incorrect-bg': 'var(--score-incorrect-bg)',
          missed: 'var(--score-missed)',
          'missed-bg': 'var(--score-missed-bg)',
        },
        // Aliases legacy (mapean a los tokens nuevos)
        primary: {
          DEFAULT: 'var(--primary)',
          container: 'var(--primary-container)',
          dim: 'var(--primary-dim)',
          fixed: 'var(--primary-fixed)',
          'fixed-dim': 'var(--primary-fixed-dim)',
          foreground: 'var(--on-primary)',
          'on-container': 'var(--on-primary-container)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          container: 'var(--accent-container)',
          hover: 'var(--accent-hover)',
          foreground: 'var(--on-accent)',
          'on-container': 'var(--on-accent-container)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          container: 'var(--secondary-container)',
          foreground: 'var(--on-secondary)',
          'on-container': 'var(--on-secondary-container)',
        },
        tertiary: {
          DEFAULT: 'var(--tertiary)',
          container: 'var(--tertiary-container)',
          foreground: 'var(--on-tertiary)',
          'on-container': 'var(--on-tertiary-container)',
        },
        // Tonos de mandarín
        tone: {
          1: 'var(--teal)',
          2: 'var(--amber)',
          3: 'var(--score-lo)',
          4: 'var(--score-hi)',
          0: 'var(--muted)',
        },
      },
      fontFamily: {
        display: ["'Outfit'", 'system-ui', 'sans-serif'],
        headline: ["'Outfit'", 'system-ui', 'sans-serif'],
        sans: ["'Inter'", 'system-ui', 'sans-serif'],
        body: ["'Inter'", 'system-ui', 'sans-serif'],
        mono: ["'JetBrains Mono'", "'Fira Code'", 'monospace'],
      },
      borderRadius: {
        sm: '0.75rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        full: '9999px',
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2.5rem',
        '2xl': '3.5rem',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.32, 0.72, 0, 1)',
        'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      animation: {
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        'slide-in': 'slideIn 300ms cubic-bezier(0.32, 0.72, 0, 1)',
        'fade-up': 'fade-up 700ms cubic-bezier(0.32, 0.72, 0, 1) both',
        'nav-in': 'nav-in 600ms cubic-bezier(0.32, 0.72, 0, 1) both',
        'streak-pulse': 'streak-pulse 2s cubic-bezier(0.16, 1, 0.3, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        slideIn: {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
        },
        'nav-in': {
          from: { opacity: '0', transform: 'translateY(-16px) scale(0.96)' },
        },
        'streak-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(232, 184, 74, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(232, 184, 74, 0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
