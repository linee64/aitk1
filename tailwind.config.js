/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0f1e',
        panel: '#0d1426',
        border: '#1a2744',
        accent: '#3b82f6',
        status: {
          high: '#ef4444',
          medium: '#f59e0b',
          low: '#22c55e',
        },
        text: {
          primary: '#e2e8f0',
          muted: '#64748b',
        }
      },
      fontFamily: {
        mono: ['Space Mono', 'IBM Plex Mono', 'monospace'],
        sans: ['Outfit', 'DM Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
}