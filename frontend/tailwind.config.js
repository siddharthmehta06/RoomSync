/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          50: '#FBFBFD',   // Apple warm canvas
          100: '#F5F5F7',  // Apple light grey container
          200: '#E5E5EA',  // Apple divider/border line
          300: '#D1D1D6',
        },
        brand: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          500: '#14B8A6',
          600: '#0D9488',  // Primary RoomSync Teal Accent
          700: '#0F766E',  // Deep Teal for active states
          800: '#115E59',
          900: '#134E4A',
        },
        ink: {
          primary: '#1D1D1F',    // Primary near-black typography
          secondary: '#6E6E73',  // Apple secondary text
          tertiary: '#86868B',   // Muted notes and timestamps
          border: 'rgba(0, 0, 0, 0.08)',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        'subtle': '0 2px 10px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'apple': '0 8px 30px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 14px 40px rgba(0, 0, 0, 0.08)',
        'float': '0 20px 48px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        'apple': '18px',
        'apple-xl': '24px',
      }
    },
  },
  plugins: [],
}
