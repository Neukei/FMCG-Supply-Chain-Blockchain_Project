/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#edfcf6',
          100: '#d3f8ea',
          200: '#aaf0d5',
          300: '#72e3ba',
          400: '#38cd9b',
          500: '#15b381',
          600: '#0a9169',
          700: '#087355',
          800: '#085c46',
          900: '#074b3a',
          950: '#022c22',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
