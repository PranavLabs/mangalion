/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}', // <--- THIS LINE IS CRITICAL
  ],
  theme: {
    extend: {
      colors: {
        dark: '#121212',
        card: '#1E1E1E',
      }
    },
  },
  plugins: [],
}
