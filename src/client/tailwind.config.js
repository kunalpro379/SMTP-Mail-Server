/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gmail: {
          red: '#ea4335',
          blue: '#4285f4',
          green: '#34a853',
          yellow: '#fbbc04',
        }
      }
    },
  },
  plugins: [],
}