/** @type {import('tailwindcss').Config} */
// KAI design system — LIGHT MODE.
//
// Spec note: CLAUDE.md v2 §7 says "Dark mode only." Evan Seder overrode that
// decision on 2026-05-19 (DECISIONS.md D-005) — parents need to trust this
// product, and "looks like a real wellness app" beats "looks edgy and dark."
// Reference aesthetic: Apple Health / Calm / Headspace. Final visual sign-off
// still belongs to Lev per CLAUDE.md §9.
//
// Brand accent hues from v2 §7 are preserved (violet #7B6EF6, warm
// #F0A868, cool #68C5B8) — they read well on light backgrounds and we keep
// recognizable identity. Status colors slightly muted for warmer palette.

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Base — warm off-white, not stark. The Calm/Headspace move.
        background: "#FAFAF7",
        surface: "#FFFFFF",
        "surface-elevated": "#FFFFFF",
        "surface-muted": "#F4F1EB",     // for subtle grouping blocks
        "surface-glass": "rgba(255, 255, 255, 0.72)", // frosted card on color
        "glass-border": "rgba(10, 10, 10, 0.06)",
        "border-line": "rgba(10, 10, 10, 0.07)",
        "border-strong": "rgba(10, 10, 10, 0.14)",

        // Brand accents (preserved from v2 §7)
        accent: "#7B6EF6",          // violet — primary brand
        "accent-warm": "#F0A868",   // warm — Body agent
        "accent-cool": "#68C5B8",   // cool — Mind agent
        // Soft tints for backgrounds + chips
        "accent-soft": "#EEEBFE",
        "accent-warm-soft": "#FDF1E4",
        "accent-cool-soft": "#E4F4F1",

        // Text — warm graphite ladder, not pure black
        "text-primary": "#1A1A1F",
        "text-secondary": "#5A5A60",
        "text-muted": "#8A8A8F",
        "text-soft": "#B5B5BA",

        // Status — muted for the warm palette
        success: "#3F9D6A",
        "success-soft": "#E2F2EA",
        warning: "#D89A2C",
        "warning-soft": "#FAF0DD",
        danger: "#C75555",
        "danger-soft": "#F7E3E3",

        // Daily Score ring thresholds (v3 §2 — never red; soft amber on low)
        "score-low": "#E8AE40",      // warm amber
        "score-mid": "#7B6EF6",      // violet accent
        "score-high": "#3F9D6A",     // success green

        // Sub-score domain hues — Mind=cool, Body=warm per v3 §4 cards.
        // Sleep/Mood/Goal tentative pending Q-002.
        mental: "#68C5B8",
        physical: "#F0A868",
        sleep: "#7B6EF6",
        mood: "#E8AE40",
        goal: "#3F9D6A",
      },
      fontFamily: {
        // §7 typography: Fraunces (display), DM Sans (UI), JetBrains Mono (stats)
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
        sans: ["DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      borderRadius: {
        sm: "10px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        glass: "24px",
      },
      boxShadow: {
        // Multi-layer shadows for that "premium app" depth
        card: "0 1px 2px rgba(10,10,10,0.04), 0 8px 24px rgba(10,10,10,0.06)",
        "card-lg":
          "0 2px 4px rgba(10,10,10,0.04), 0 16px 40px rgba(10,10,10,0.08)",
        glass:
          "0 1px 2px rgba(10,10,10,0.04), 0 8px 32px rgba(10,10,10,0.08)",
        "glass-lg":
          "0 2px 4px rgba(10,10,10,0.05), 0 24px 56px rgba(10,10,10,0.10)",
        // Inset hairline used on raised buttons / chips
        hairline: "inset 0 0 0 1px rgba(10,10,10,0.06)",
      },
      backdropBlur: {
        glass: "18px",
        "glass-lg": "24px",
      },
      keyframes: {
        "fade-slide-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-press": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.96)" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.9" },
          "50%": { transform: "scale(1.04)", opacity: "1" },
        },
        // Hydration-goal celebration animations (HydrationTile)
        "celebrate-chip": {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "40%": { transform: "scale(1.25)", opacity: "1" },
          "70%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "celebrate-ripple": {
          "0%, 100%": { transform: "scaleY(1)" },
          "50%": { transform: "scaleY(1.4)" },
        },
      },
      animation: {
        "fade-slide-up": "fade-slide-up 380ms ease-out",
        "scale-press": "scale-press 220ms ease-out",
        breathe: "breathe 4s ease-in-out infinite",
        "celebrate-chip": "celebrate-chip 600ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "celebrate-ripple": "celebrate-ripple 380ms ease-out",
      },
    },
  },
  plugins: [],
};
