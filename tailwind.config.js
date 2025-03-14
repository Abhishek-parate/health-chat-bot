/** @type {import('tailwindcss').Config} */
// tailwind.config.js
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0ea5e9',
          dark: '#0284c7',
          light: '#38bdf8'
        },
        secondary: {
          DEFAULT: '#8b5cf6',
          dark: '#7c3aed',
          light: '#a78bfa'
        },
        background: {
          DEFAULT: '#f1f5f9',
          dark: '#0f172a'
        }
      },
    },
  },
  plugins: [],
}