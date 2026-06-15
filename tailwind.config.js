/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        medfair: {
          DEFAULT: "#020e7c",
          hover: "#0a1a8f",
          dark: "#0c1d8f",
          light: "#1e40af",
        },
      },
    },
  },
  plugins: [],
};