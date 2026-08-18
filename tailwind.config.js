/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        corporate: {
          50: '#f0f7f8',
          100: '#d9ebed',
          200: '#b3d7db',
          300: '#7fb8bf',
          400: '#4d96a0',
          500: '#2c777f',
          600: '#245157',
          700: '#1d454d',
          800: '#16363c',
          900: '#0f2429',
          950: '#00343C',
        },
        accent: {
          50: '#f0f7f8',
          100: '#d9ebed',
          200: '#b3d7db',
          300: '#7fb8bf',
          400: '#4d96a0',
          500: '#2c777f',
          600: '#245157',
          700: '#1d454d',
          800: '#16363c',
          900: '#0f2429',
          950: '#00343C',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(36, 81, 87, 0.4)' },
          '70%': { boxShadow: '0 0 0 12px rgba(36, 81, 87, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(36, 81, 87, 0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
