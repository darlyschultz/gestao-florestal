/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50:  '#f0f9f4',
          100: '#dcf0e5',
          200: '#bbe1ce',
          300: '#8ccaad',
          400: '#57ac87',
          500: '#338f6a',
          600: '#237254',
          700: '#1a5940',
          800: '#174835',
          900: '#143b2c',
          950: '#0a2119',
        },
        primary: {
          DEFAULT: '#1a4731',
          light: '#237254',
          dark: '#0a2119',
        },
        accent: {
          yellow: '#f5a623',
          'yellow-light': '#fef3c7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 2px 12px 0 rgba(0,0,0,0.08)',
        'card-hover': '0 4px 20px 0 rgba(0,0,0,0.12)',
      },
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
}
