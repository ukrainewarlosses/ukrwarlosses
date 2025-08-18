/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#d4a574',
        'primary-dark': '#a0824a',
        background: '#1b1b1b',
        'card-bg': '#2a2a2a',
        'border-color': '#3d3d3d',
        'text-primary': '#f5f5f5',
        'text-secondary': '#e2e8f0',
        'text-muted': '#cbd5e0',
        'text-light': '#a0aec0',
        casualty: '#ff6b6b',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
