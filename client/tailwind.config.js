/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        medieval: ['MedievalSharp', 'cursive'],
      },
      colors: {
        'dnd-red': {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        'dungeon-gold': {
          DEFAULT: '#c9a24d',
          light: '#e0b865',
        },
        'dungeon-red': '#7a1f1f',
        'dungeon-green': '#2f7d4a',
        'dungeon-dark': {
          DEFAULT: '#0e0e0e',
          lighter: '#141414',
          panel: '#1b1b1b',
        },
      },
    },
  },
  plugins: [],
}
