/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "420px",
      },
      colors: {
        primary: "#2563eb",
        "primary-hover": "#1d4ed8",
        "primary-container": "#dbeafe",
        "primary-dark": "#1e3a8a",
      },
    },
  },
  plugins: [],
};
