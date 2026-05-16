import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary — Deep Slate
        primary: {
          DEFAULT: '#2d3142',
          container: '#e8e6f0',
          dim: '#3d4055',
          fixed: '#e8e6f0',
          'fixed-dim': '#d4d2e0',
          foreground: '#ffffff',
          'on-container': '#1a1d2e',
        },
        // Accent — Terracotta
        accent: {
          DEFAULT: '#c45d3e',
          container: '#fce8e2',
          hover: '#a84e33',
          foreground: '#ffffff',
          'on-container': '#8b3a24',
        },
        // Secondary — Warm Sage
        secondary: {
          DEFAULT: '#5a7a5a',
          container: '#e0ede0',
          foreground: '#ffffff',
          'on-container': '#3d5a3d',
        },
        // Tertiary — Warm Gold
        tertiary: {
          DEFAULT: '#9a7b4f',
          container: '#f5ecd8',
          foreground: '#ffffff',
          'on-container': '#6b5633',
        },
        // Score Colors
        score: {
          correct: '#3d8b4f',
          'correct-bg': 'rgba(61, 139, 79, 0.1)',
          partial: '#b8860b',
          'partial-bg': 'rgba(184, 134, 11, 0.1)',
          incorrect: '#c0392b',
          'incorrect-bg': 'rgba(192, 57, 43, 0.1)',
          missed: '#7a7674',
          'missed-bg': 'rgba(122, 118, 116, 0.1)',
        },
      },
      fontFamily: {
        headline: ["'DM Serif Display'", 'Georgia', 'serif'],
        body: ["'Be Vietnam Pro'", 'system-ui', 'sans-serif'],
        mono: ["'JetBrains Mono'", "'Fira Code'", 'monospace'],
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem',
      },
      animation: {
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        'slide-in': 'slideIn 250ms ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'slide-in': {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config