/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f4fb',
          100: '#b3def3',
          200: '#80c8eb',
          300: '#4db2e3',
          400: '#1a9cdb',
          500: '#00A0E3',
          600: '#0080B8',
          700: '#00608A',
          800: '#00405C',
          900: '#00202E',
        },
        secondary: {
          400: '#4DB8E8',
          500: '#00A0E3',
          600: '#0080B8',
        },
        dark: {
          700: '#1a2234',
          800: '#111827',
          900: '#0B1120',
          950: '#060a14',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'gradient': 'gradient 8s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-up': 'fadeInUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 3s infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        fadeInUp: {
          from: {
            opacity: '0',
            transform: 'translateY(30px)'
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)'
          },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      backgroundSize: {
        '300%': '300% 300%',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
