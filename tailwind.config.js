/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FFFFFF',
        warm: '#FAFAF8',
        avocado: '#ADBF15',
        avocadoInk: '#465217',
        avocadoSoft: '#F1F5D6',
        coral: '#F4A46D',
        coralSoft: '#FFF1E8',
        coralInk: '#6B4326',
        ink: '#22271F',
        muted: '#777D70',
        line: '#ECEDE8',
      },
      boxShadow: {
        card: '0 8px 24px rgba(35, 45, 20, 0.06)',
        elevated: '0 12px 32px rgba(35, 45, 20, 0.09)',
        modal: '0 20px 48px rgba(35, 45, 20, 0.16)',
      },
    },
  },
  plugins: [],
};
