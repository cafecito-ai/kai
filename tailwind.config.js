/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A0A0A",
        paper: "#FAFAF7",
        warmPaper: "#F4F1EB",
        line: "#E5E2D9",
        muted: "#6B6B65",
        soft: "#A8A8A0",
        mist: "#F4F1EB",
        sage: "#2D7A3E",
        sky: "#5B47F0",
        coral: "#FF6B45",
        plum: "#5B47F0",
        amber: "#E7A326",
        lime: "#DCEEDF",
        danger: "#B42318",
        night: "#0A0A0A",
        graphite: "#2A2A28"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Inter Tight", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Instrument Serif", "Georgia", "serif"]
      },
      borderRadius: {
        kai: "8px"
      },
      boxShadow: {
        soft: "0 24px 60px rgba(10, 10, 10, 0.08)"
      }
    }
  },
  plugins: []
};
