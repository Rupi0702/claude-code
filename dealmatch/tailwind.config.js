/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Deep Navy palette
        navy: {
          950: '#070d1f',
          900: '#0a1128',
          800: '#0f1a3a',
          700: '#15244d',
          600: '#1d3060',
          500: '#28407e',
        },
        // Gold accents
        gold: {
          400: '#e6c860',
          500: '#d4af37',
          600: '#b8941f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        app: '480px',
      },
    },
  },
  plugins: [],
}
