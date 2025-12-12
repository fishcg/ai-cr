/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        terminal: {
          black: '#0c0c0c',
          dark: '#121212',
          gray: '#1e1e1e',
          border: '#333333',
          green: '#22c55e',
          blue: '#3b82f6',
          purple: '#a855f7',
          red: '#ef4444',
          text: '#e5e5e5',
          dim: '#a1a1aa'
        }
      }
    }
  },
  plugins: [],
}
