/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0D9488',
          hover: '#0F766E',
          dark: '#115E59',
          light: '#F0FDFA',
        },
        forest: {
          DEFAULT: '#0D9488',
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#0D9488',
          950: '#134E4A',
        },
        teal: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
          950: '#042F2E',
        },
        mess: {
          forest: '#0D9488',
          primary: '#0D9488',
          dark: '#115E59',
          muted: '#64748B',
          surface: '#F7FAFA',
          bg: '#F7FAFA',
          card: '#FFFFFF',
          border: '#E2E8F0',
          accent: '#CCFBF1',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'forest-sm': '0 2px 8px -1px rgba(13, 148, 136, 0.12), 0 1px 3px -1px rgba(0, 0, 0, 0.04)',
        'forest-md': '0 6px 20px -2px rgba(13, 148, 136, 0.16), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'forest-lg': '0 14px 34px -4px rgba(13, 148, 136, 0.22), 0 4px 12px -2px rgba(0, 0, 0, 0.05)',
        'teal-sm': '0 2px 8px -1px rgba(13, 148, 136, 0.12), 0 1px 3px -1px rgba(0, 0, 0, 0.04)',
        'teal-md': '0 6px 20px -2px rgba(13, 148, 136, 0.16), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'teal-lg': '0 14px 34px -4px rgba(13, 148, 136, 0.22), 0 4px 12px -2px rgba(0, 0, 0, 0.05)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 10px 25px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
