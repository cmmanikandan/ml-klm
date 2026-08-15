/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        warm: {
          bg: '#FFF9F2',
          card: '#FFFFFF',
          border: '#FDE68A',
          hover: '#FFF3E4',
          muted: '#F5ECE1',
        },
        charcoal: {
          900: '#111827',
          800: '#1F2937',
          700: '#374151',
          600: '#4B5563',
          500: '#6B7280',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'warm': '0 4px 20px -2px rgba(234, 88, 12, 0.08)',
        'warm-lg': '0 10px 30px -4px rgba(234, 88, 12, 0.12)',
        'card': '0 2px 12px 0 rgba(17, 24, 39, 0.04)',
      }
    },
  },
  plugins: [],
};
