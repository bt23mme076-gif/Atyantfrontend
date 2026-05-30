/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#c88b4a",
        darkbg: "#0b0b0b",
        card: "#151515",
      },
    },
  },
  plugins: [],
}
