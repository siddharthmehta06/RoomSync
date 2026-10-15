/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: '#FAF9F6', // Main background
        charcoal: '#202124', // Primary text
        surface: {
          50: '#FAF9F6',   // Warm ivory background
          100: '#F4F2ED',  // Soft container fill
          200: '#E9E7E2',  // Subtle warm gray border
          300: '#D8D4CC',
        },
        brand: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          500: '#14B8A6',
          600: '#0D9488',  // Primary RoomSync Teal Accent
          700: '#0F766E',  // Deep Teal for active/hover states
          800: '#115E59',
          900: '#134E4A',
        },
        ink: {
          primary: '#202124',    // Primary charcoal typography
          secondary: '#72777F',  // Muted slate secondary
          tertiary: '#9AA0A6',   // Muted tertiary / placeholders
        },
        line: '#E9E7E2', // Fine borders
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(32, 33, 36, 0.04), 0 1px 2px rgba(32, 33, 36, 0.02)',
        'soft': '0 4px 20px -2px rgba(32, 33, 36, 0.04), 0 2px 6px -1px rgba(32, 33, 36, 0.02)',
        'card': '0 2px 8px -1px rgba(32, 33, 36, 0.04), 0 1px 3px rgba(32, 33, 36, 0.02)',
        'card-hover': '0 12px 32px -4px rgba(32, 33, 36, 0.07), 0 4px 12px -2px rgba(32, 33, 36, 0.03)',
        'search': '0 8px 30px rgba(32, 33, 36, 0.06)',
      },
      borderRadius: {
        'apple': '16px',
        'apple-xl': '22px',
        'apple-2xl': '28px',
      }
    },
  },
  plugins: [],
}
