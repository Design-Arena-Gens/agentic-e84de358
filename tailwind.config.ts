import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        base: {
          50: '#f6f7fb',
          100: '#eceef6',
          200: '#d7dced',
          300: '#b6c0de',
          400: '#8ea0cb',
          500: '#6b84bb',
          600: '#536aa7',
          700: '#445588',
          800: '#39476f',
          900: '#303b5b'
        }
      },
      boxShadow: {
        soft: '0 2px 12px rgba(16, 24, 40, 0.1)'
      }
    }
  },
  plugins: []
} satisfies Config
