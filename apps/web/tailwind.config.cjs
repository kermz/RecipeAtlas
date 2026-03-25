/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 20px 80px rgba(91, 140, 255, 0.18)',
        insetSoft: 'inset 0 1px 0 rgba(255,255,255,0.1)'
      },
      colors: {
        ink: {
          50: '#f7f8fc',
          100: '#eef1f9',
          200: '#d8deee',
          300: '#b7c0da',
          400: '#8591b0',
          500: '#5f6b8c',
          600: '#49536d',
          700: '#363d52',
          800: '#222838',
          900: '#111420'
        }
      }
    }
  },
  plugins: []
};
