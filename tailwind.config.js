/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#141414",
        paper: "#FAF7F0",
        sage: "#88A47C",
        sky: "#6AA9D8",
        coral: "#E6785F",
        plum: "#7C5C7A",
        amber: "#F2B84B",
        danger: "#B42318"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      borderRadius: {
        kai: "8px"
      }
    }
  },
  plugins: []
};
