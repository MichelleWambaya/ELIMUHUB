/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      // Colors read from CSS variables (set in src/styles/index.css and
      // adjusted at runtime by ThemeContext) instead of fixed hex values,
      // so light/dark and a user-chosen accent color can both apply
      // without touching a single className anywhere in the app.
      colors: {
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        surface2: 'rgb(var(--color-surface2) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        accentDim: 'rgb(var(--color-accent-dim) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
      },
      boxShadow: {
        glow: '0 0 0 1px rgb(var(--color-accent) / 0.25), 0 8px 24px rgb(var(--color-accent) / 0.08)',
      },
    },
  },
  plugins: [],
};
