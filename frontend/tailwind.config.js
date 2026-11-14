/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        navy: {
          50: '#eef3fc', 100: '#d9e4f8', 200: '#b5c9f0', 300: '#86a4e2', 400: '#5a7fd0',
          500: '#3a60b8', 600: '#2a4b99', 700: '#1f3a7a', 800: '#172c5e', 900: '#101f45', 950: '#0a1530',
        },
        ice: { 50: '#f3f9ff', 100: '#e4f1fd', 200: '#c9e3fa', 300: '#9cccf5' },
      },
      boxShadow: {
        panel: '0 1px 2px rgba(16,31,69,.06), 0 8px 24px -12px rgba(16,31,69,.18)',
      },
    },
  },
  plugins: [],
};
