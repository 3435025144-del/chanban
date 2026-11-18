/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F8F8EB',
        avocado: '#ADBF15',
        avocadoDark: '#8DA30F',
        avocadoSoft: '#E7ECC0',
        coral: '#F4A46D',
        coralDark: '#DF8853',
        peach: '#FDE8D8',
        mint: '#DCE8A8',
        mintSoft: '#F0F4D9',
        ink: '#20240F',
        muted: '#8B9078',
        line: '#E7E8D6',
      },
      boxShadow: {
        card: '0 8px 24px rgba(74, 86, 28, 0.08)',
        pop: '0 14px 32px rgba(173, 191, 21, 0.28)',
      },
      borderRadius: {
        '4xl': '28px',
      },
    },
  },
  plugins: [],
};
