/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#061B2D',
          light: '#0F2F4C',
          dark: '#030E18',
        },
        green: {
          dark: '#0C4737',
          DEFAULT: '#2F8F7A',
          mint: '#BEE8D8',
          light: '#3ea68e',
        },
        cream: {
          DEFAULT: '#F9F6EE',
          dark: '#F4F1E8',
          light: '#FFFFFF',
        },
        text: {
          primary: '#061B2D',
          secondary: '#5F6B76',
        },
        success: '#2F8F7A',
        warning: '#E8A317',
        danger: '#E76F51',
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica Neue', 'SF Pro Display', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(6, 27, 45, 0.08)',
        'glass-hover': '0 12px 40px 0 rgba(6, 27, 45, 0.15)',
        glow: '0 0 20px rgba(47, 143, 122, 0.15)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
