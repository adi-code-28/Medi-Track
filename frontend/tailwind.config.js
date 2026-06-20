/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
      },
      colors: {
        clinical: {
          50: "#F8FAFB",
          100: "#EEF4F4",
          500: "#0D9488",
          600: "#0F766E",
          700: "#115E59",
        },
        status: {
          normal: "#22C55E",
          warning: "#F59E0B",
          critical: "#EF4444",
        },
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
      },
    },
  },
  plugins: [],
};
