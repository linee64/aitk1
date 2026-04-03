/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-primary)',
        panel: 'var(--bg-panel)',
        border: 'var(--border-ui)',
        accent: 'var(--accent)',
        status: {
          high: '#ef4444',
          medium: '#f59e0b',
          low: '#22c55e',
        },
        text: {
          primary: 'var(--text-primary)',
          muted: 'var(--text-muted)',
        },
      },
      fontFamily: {
        mono: ['Space Mono', 'IBM Plex Mono', 'monospace'],
        sans: ['Outfit', 'DM Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
}