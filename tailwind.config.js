/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        trac: {
          50: '#f0f4ff',
          100: '#e0e9fe',
          200: '#bae2fd',
          300: '#7ccbfd',
          400: '#36b0fa',
          500: '#0c92eb',
          600: '#0073c9',
          700: '#015ca4',
          800: '#064e86',
          900: '#0b416f',
          950: '#072a4a',
        },
        dark: {
          bg: '#0f172a',
          surface: '#1e293b',
          border: '#334155',
          hover: '#334155',
        }
      }
    },
  },
  plugins: [],
}
