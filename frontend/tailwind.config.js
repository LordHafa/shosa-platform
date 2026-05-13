/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        navy: '#0B1F4D',
        gold: '#F2C94C',
        deepGold: '#B8860B',
        cream: '#FFF8E7',
        ink: '#172033',
        muted: '#64748B'
      }
    }
  },
  plugins: []
}
