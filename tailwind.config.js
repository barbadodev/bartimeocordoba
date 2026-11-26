/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./resources/views/**/*.blade.php",
    "./resources/js/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bartimeo: {
          50: '#FAF6F3',
          100: '#F5EBE6',
          200: '#E8DFDA',
          300: '#D4C3BC',
          600: '#7E2A38',
          700: '#6D1E2C',
          800: '#5C1824',
          900: '#3B0E16',
          950: '#26070D'
        },
        dorado: {
          light: '#F8E9C0',
          DEFAULT: '#E0B44C',
          dark: '#B86508'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        serif: ['Cinzel', 'Georgia', 'serif']
      }
    }
  },
  plugins: []
};

