/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#6366f1', // The primary vibrant purple/indigo from the mockup
          600: '#4f46e5',
        },
        app: {
          bg: '#f8f9fc', // Soft off-white background
          card: '#ffffff',
          text: '#1e293b',
          muted: '#94a3b8',
        }
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.04)',
        'float': '0 10px 25px -5px rgba(99, 102, 241, 0.25)', // Purple glow shadow for buttons
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'], 
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}