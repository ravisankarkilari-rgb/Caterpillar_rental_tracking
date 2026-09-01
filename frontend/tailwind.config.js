/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cat: {
          yellow: '#F59E0B',        // Cat Construction Gold
          yellowLight: '#FEF3C7',
          yellowDark: '#D97706',
          bg: '#0B0F17',            // Deep slate background
          surface: '#111827',       // Elevated surface
          card: '#1F2937',          // Card surface
          cardHover: '#283548',
          border: '#374151',
          borderSubtle: '#1F2937',
          muted: '#9CA3AF',
          light: '#F3F4F6'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
