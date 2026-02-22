/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gremio-gold': '#d4af37',
        'gremio-dark': '#121212',
        'gremio-card': '#1e1e1e',
      }
    },
  },
  plugins: [],
}