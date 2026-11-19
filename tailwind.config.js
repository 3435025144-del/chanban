/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FFFFFF',
        warm: '#F8F9F6',
        avocado: '#48A860',
        avocadoInk: '#FFFFFF',
        avocadoDeep: '#2F6B41',
        avocadoSoft: '#E8F5EA',
        coral: '#FF7F50',
        coralInk: '#FFFFFF',
        coralDeep: '#B85B38',
        coralSoft: '#FFF1E8',
        water: '#DCEBF5',
        waterInk: '#4E7D99',
        ink: '#20251F',
        muted: '#8A9187',
        line: '#EEF0EC',
      },
      boxShadow: {
        card: '0 8px 28px rgba(31, 54, 38, 0.06)',
        elevated: '0 16px 40px rgba(31, 54, 38, 0.10)',
        modal: '0 24px 56px rgba(31, 54, 38, 0.18)',
      },
    },
  },
  plugins: [],
};
