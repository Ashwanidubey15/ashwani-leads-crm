/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: "media", // or "class" if you want a toggle
  corePlugins: {
    preflight: false, // <-- disable Tailwind reset (preflight)
  },
  theme: {
    extend: {},
  },
  plugins: [],
};