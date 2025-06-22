/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'tennis-green': '#228B22',
        'court-blue': '#4A90E2',
        'captain-gold': '#FFD700'
      }
    },
  },
  plugins: [],
}