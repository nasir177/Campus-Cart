/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#00a884",   // Modern Blinkit-style deep emerald green tint
        secondary: "#1c1c1e", // Deep charcoal black for text elements
        accent: "#f2f2f7",    // Off-white light gray background container filling
      }
    },
  },
  plugins: [],
}