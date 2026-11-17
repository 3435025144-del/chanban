/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FFF8F2',
        coral: '#FF7A66',
        coralDark: '#F0604B',
        peach: '#FFE6D9',
        mint: '#77CDB3',
        mintSoft: '#E6F7F1',
        ink: '#3B302C',
        muted: '#9A8B84',
        line: '#F0E2D8',
      },
      boxShadow: {
        card: '0 6px 22px rgba(255, 122, 102, 0.10)',
        pop: '0 12px 30px rgba(255, 122, 102, 0.22)',
      },
    },
  },
  plugins: [],
};
