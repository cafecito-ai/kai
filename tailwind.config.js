/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#151323",
        paper: "#FFF8EE",
        warmPaper: "#FFEFD9",
        line: "#E8DCCB",
        muted: "#665D75",
        soft: "#F7ECD8",
        mist: "#FFF2E2",
        body: "#1F7A50",
        bodyWash: "#DDF6DF",
        goals: "#6844C4",
        goalsWash: "#EEE7FF",
        reset: "#C6452E",
        resetWash: "#FFE6D9",
        care: "#227AA8",
        careWash: "#DDF2FF",
        sage: "#1F7A50",
        sky: "#227AA8",
        coral: "#FF7C5C",
        plum: "#6844C4",
        amber: "#C47B16",
        lime: "#DDF6DF",
        danger: "#B42318",
        dangerWash: "#FFF0EC",
        night: "#151323",
        graphite: "#2C273A"
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
        soft: "0 18px 44px rgba(31, 26, 46, 0.12)",
        sticker: "4px 4px 0 #151323"
      }
    }
  },
  plugins: []
};
