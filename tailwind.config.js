/** @type {import('tailwindcss').Config} */
// KAI design system tokens — CLAUDE.md v2 §7 with CLAUDE_v3_PATCH §2 overlay.
// Dark-mode only. The light-mode palette from v0 (paper/ink/sage/plum/etc) is
// intentionally removed per AGENT_PLAN T-003. Components still referencing
// removed names will no-op until they're rewritten in later tasks.

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // §7 base palette
        background: "#0A0A0F",
        surface: "#13131A",
        "surface-elevated": "#1C1C26",
        // GlassCard overlay + 1px border (§7 GlassCard spec)
        "surface-glass": "rgba(255, 255, 255, 0.04)",
        "glass-border": "rgba(255, 255, 255, 0.08)",
        // Structural border line (§7)
        "border-line": "rgba(255, 255, 255, 0.07)",
        // Accents (§7)
        accent: "#7B6EF6",
        "accent-warm": "#F0A868",
        "accent-cool": "#68C5B8",
        // Text (§7)
        "text-primary": "#F0F0F5",
        "text-secondary": "rgba(240, 240, 245, 0.55)",
        "text-muted": "rgba(240, 240, 245, 0.3)",
        // Status (§7)
        success: "#5EBF8A",
        warning: "#F0C568",
        danger: "#E06B6B",
        // Sub-score domain hues (tentative per Q-002 — confirm with Ratner).
        // Mind/Body card colors come from v3 §4 (Mind=accentCool, Body=accentWarm).
        // Sleep/mood mapped from v3 §2 score thresholds.
        mental: "#68C5B8",
        physical: "#F0A868",
        sleep: "#7B6EF6",
        mood: "#F0C568",
        goal: "#5EBF8A",
        // Score-ring thresholds (v3 §2)
        "score-low": "#F0C568",
        "score-mid": "#7B6EF6",
        "score-high": "#5EBF8A",
      },
      fontFamily: {
        // §7: display=Fraunces, body/UI=DM Sans, stats/numbers=JetBrains Mono
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
        // §7 radius scale
        sm: "10px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        // GlassCard default (§7) — matches lg, kept as a named alias
        glass: "24px",
      },
      boxShadow: {
        // Dark-mode glass elevations
        glass: "0 8px 32px rgba(0, 0, 0, 0.36)",
        "glass-lg": "0 16px 56px rgba(0, 0, 0, 0.42)",
      },
      backdropBlur: {
        // §7 GlassCard backdrop blur intensity = 18
        glass: "18px",
        "glass-lg": "24px",
      },
      keyframes: {
        // §7 CSS-expressible animation presets
        "fade-slide-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-press": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.96)" },
        },
      },
      animation: {
        "fade-slide-up": "fade-slide-up 380ms ease-out",
        "scale-press": "scale-press 220ms ease-out",
      },
    },
  },
  plugins: [],
};
