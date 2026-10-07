/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        theme: {
          bg: 'var(--bg-canvas)',
          surface: 'var(--bg-surface)',
          'surface-soft': 'var(--bg-surface-soft)',
          'surface-elevated': 'var(--bg-surface)',
          'surface-active': 'var(--bg-selected)',
          'surface-secondary': 'var(--bg-surface-soft)',
          border: 'var(--border-default)',
          'border-soft': 'var(--border-soft)',
          'border-input': 'var(--border-input)',
          main: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          primary: 'var(--accent-primary)',
          'primary-hover': 'var(--accent-hover)',
          'accent-soft': 'var(--accent-soft)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
