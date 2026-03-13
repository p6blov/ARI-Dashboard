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
        yt: {
          base:     '#000000',
          surface:  '#1a1a1a',
          elevated: '#1f1f1f',
          hover:    '#2a2a2a',
          line:     '#2f2f2f',
          muted:    '#5a5a5a',
        },
      },
    },
  },
  plugins: [],
}
