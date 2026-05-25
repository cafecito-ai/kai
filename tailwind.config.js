/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A0A0A",
        ink2: "#2A2A28",
        // "v2" ink shades used by Home / Onboarding / AppShell. Slightly
        // lighter than `ink` to read better at small sizes on warm paper.
        // Names kept compact so utility classes don't grow unwieldy.
        inkDeep: "#111116",
        inkDark: "#1A1A1F",
        inkSoft: "#5E5E64",
        inkMute: "#8A8A8F",
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
        plumWash: "#EEEAFF",
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
        sans: ["DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Fraunces", "DM Sans", "ui-serif", "serif"],
        serif: ["Fraunces", "Georgia", "serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
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
