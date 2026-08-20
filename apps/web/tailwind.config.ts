import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('daisyui')],
  daisyui: {
    themes: [
      {
        concilia: {
          primary: '#0D9488',
          'primary-content': '#EFFDFB',
          secondary: '#1E3A5F',
          'secondary-content': '#E7EEF6',
          accent: '#F59E0B',
          'accent-content': '#1C1305',
          neutral: '#1E293B',
          'neutral-content': '#E2E8F0',
          'base-100': '#FFFFFF',
          'base-200': '#F4F6F8',
          'base-300': '#E5E9EE',
          'base-content': '#0F172A',
          info: '#0284C7',
          success: '#16A34A',
          warning: '#D97706',
          error: '#DC2626',
          '--rounded-box': '0.75rem',
          '--rounded-btn': '0.5rem',
          '--rounded-badge': '0.5rem',
        },
      },
      {
        concilianight: {
          primary: '#2DD4BF',
          'primary-content': '#04211D',
          secondary: '#3B82C4',
          'secondary-content': '#04141F',
          accent: '#FBBF24',
          'accent-content': '#1C1305',
          neutral: '#1E293B',
          'neutral-content': '#E2E8F0',
          'base-100': '#0B1220',
          'base-200': '#111827',
          'base-300': '#1E293B',
          'base-content': '#E5E9EE',
          info: '#38BDF8',
          success: '#34D399',
          warning: '#FBBF24',
          error: '#F87171',
          '--rounded-box': '0.75rem',
          '--rounded-btn': '0.5rem',
          '--rounded-badge': '0.5rem',
        },
      },
    ],
    darkTheme: 'concilianight',
    base: false,
  },
};

export default config;
