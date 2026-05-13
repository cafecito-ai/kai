/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A0A0A",
        ink2: "#2A2A28",
        paper: "#FAFAF7",
        warmPaper: "#F4F1EB",
        white: "#FFFFFF",
        line: "#E5E2D9",
        muted: "#6B6B65",
        soft: "#A8A8A0",
        mist: "#F4F1EB",
        body: "#2D7A3E",
        bodyWash: "#DCEEDF",
        goals: "#5B47F0",
        goalsWash: "#EEEAFF",
        reset: "#FF6B45",
        resetWash: "#FFE8DD",
        care: "#5B47F0",
        careWash: "#EEEAFF",
        sage: "#2D7A3E",
        sky: "#5B47F0",
        coral: "#FF6B45",
        plum: "#5B47F0",
        amber: "#B76618",
        lime: "#DCEEDF",
        danger: "#B42318",
        dangerWash: "#FFF0EC",
        night: "#0A0A0A",
        graphite: "#2A2A28"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Inter Tight", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Instrument Serif", "Georgia", "serif"]
      },
      borderRadius: {
        kai: "18px",
        calm: "28px"
      },
      boxShadow: {
        soft: "0 18px 44px rgba(10, 10, 10, 0.08)",
        calm: "0 24px 80px rgba(10, 10, 10, 0.10)",
        sticker: "0 0 0 1px rgba(10, 10, 10, 0.08)"
      }
    }
  },
  plugins: []
};
