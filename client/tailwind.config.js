/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",  // ✅ tells Tailwind where to look for class names
  ],
  theme: {
    extend: {}, // you can add custom colors, fonts, etc. here later
  },
  plugins: [],
};
