/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "deep-green": "#0F3D2E",
        teal: "#15665C",
        "teal-light": "#1E8477",
        gold: "#C9A227",
        "gold-light": "#E7C767",
        "warm-white": "#FAF6EC",
        sand: "#F1E8CE",
        ink: "#1C1B14",
        muted: "#8A8368",
        line: "#E4DBBE",
      },
      fontFamily: {
        display: ["Amiri", "Georgia", "serif"],
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        phone: "34px",
      },
    },
  },
  plugins: [],
};
