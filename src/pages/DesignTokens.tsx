// /_design-tokens — visual reference grid for the KAI design system.
// Lives outside auth on purpose so the build agent and reviewers can verify
// T-003's done_when ("test page renders all colors, all font sizes, all
// shadows, all radii in a visible grid").

import { springGentle, springSnappy } from "../lib/animation";

const COLOR_TOKENS: ReadonlyArray<{
  name: string;
  className: string;
  hex: string;
  note?: string;
}> = [
  { name: "background", className: "bg-background", hex: "#0A0A0F" },
  { name: "surface", className: "bg-surface", hex: "#13131A" },
  {
    name: "surface-elevated",
    className: "bg-surface-elevated",
    hex: "#1C1C26",
  },
  {
    name: "surface-glass",
    className: "bg-surface-glass",
    hex: "rgba(255,255,255,0.04)",
    note: "GlassCard overlay",
  },
  {
    name: "glass-border",
    className: "bg-glass-border",
    hex: "rgba(255,255,255,0.08)",
    note: "GlassCard 1px border",
  },
  {
    name: "border-line",
    className: "bg-border-line",
    hex: "rgba(255,255,255,0.07)",
    note: "structural divider",
  },
  { name: "accent", className: "bg-accent", hex: "#7B6EF6" },
  { name: "accent-warm", className: "bg-accent-warm", hex: "#F0A868" },
  { name: "accent-cool", className: "bg-accent-cool", hex: "#68C5B8" },
  {
    name: "text-primary",
    className: "bg-text-primary",
    hex: "#F0F0F5",
    note: "body copy",
  },
  {
    name: "text-secondary",
    className: "bg-text-secondary",
    hex: "rgba(240,240,245,0.55)",
  },
  {
    name: "text-muted",
    className: "bg-text-muted",
    hex: "rgba(240,240,245,0.3)",
  },
  { name: "success", className: "bg-success", hex: "#5EBF8A" },
  { name: "warning", className: "bg-warning", hex: "#F0C568" },
  { name: "danger", className: "bg-danger", hex: "#E06B6B" },
];

const SCORE_THRESHOLDS = [
  { range: "0–40", className: "bg-score-low", hex: "#F0C568" },
  { range: "41–70", className: "bg-score-mid", hex: "#7B6EF6" },
  { range: "71–100", className: "bg-score-high", hex: "#5EBF8A" },
];

const SUB_SCORE_TOKENS = [
  { name: "mental", className: "bg-mental", hex: "#68C5B8" },
  { name: "physical", className: "bg-physical", hex: "#F0A868" },
  { name: "sleep", className: "bg-sleep", hex: "#7B6EF6" },
  { name: "mood", className: "bg-mood", hex: "#F0C568" },
  { name: "goal", className: "bg-goal", hex: "#5EBF8A" },
];

const FONT_SIZE_SAMPLES = [
  { size: "text-xs", label: "12px" },
  { size: "text-sm", label: "14px" },
  { size: "text-base", label: "16px" },
  { size: "text-lg", label: "18px" },
  { size: "text-xl", label: "20px" },
  { size: "text-2xl", label: "24px" },
  { size: "text-3xl", label: "30px" },
  { size: "text-4xl", label: "36px" },
  { size: "text-5xl", label: "48px" },
  { size: "text-6xl", label: "60px" },
  { size: "text-7xl", label: "72px" },
];

const RADII = [
  { name: "sm", className: "rounded-sm", px: "10px" },
  { name: "md", className: "rounded-md", px: "16px" },
  { name: "lg", className: "rounded-lg", px: "24px" },
  { name: "xl", className: "rounded-xl", px: "32px" },
  { name: "glass", className: "rounded-glass", px: "24px (alias of lg)" },
  { name: "full", className: "rounded-full", px: "9999px" },
];

const SHADOWS = [
  {
    name: "glass",
    className: "shadow-glass",
    note: "primary card depth",
  },
  {
    name: "glass-lg",
    className: "shadow-glass-lg",
    note: "modal / hero depth",
  },
];

const BLURS = [
  { name: "backdrop-blur-glass", className: "backdrop-blur-glass" },
  { name: "backdrop-blur-glass-lg", className: "backdrop-blur-glass-lg" },
];

export function DesignTokens() {
  return (
    <div className="min-h-screen bg-background font-sans text-text-primary">
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <header className="mb-10 space-y-2">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">
            KAI / design tokens
          </p>
          <h1 className="font-display text-5xl font-semibold leading-tight tracking-tight">
            v2 §7 + v3 patch
          </h1>
          <p className="text-text-secondary">
            Reference grid for T-003. Dark-mode only. The legacy light-mode
            tokens have been removed.
          </p>
        </header>

        <Section title="Colors" eyebrow="palette">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {COLOR_TOKENS.map((c) => (
              <Swatch key={c.name} {...c} />
            ))}
          </div>
        </Section>

        <Section
          title="Score thresholds"
          eyebrow="v3 §2"
          note="Never red — soft amber on the low end. Color flips at 41 and 71."
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {SCORE_THRESHOLDS.map((t) => (
              <div
                key={t.range}
                className="overflow-hidden rounded-lg border border-glass-border bg-surface"
              >
                <div className={`h-20 ${t.className}`} />
                <div className="space-y-1 px-4 py-3">
                  <div className="font-mono text-lg font-medium">
                    {t.range}
                  </div>
                  <div className="font-mono text-xs text-text-muted">
                    {t.hex}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Sub-score domain hues"
          eyebrow="tentative — see Q-002"
          note="Mind=accent-cool, Body=accent-warm match v3 §4 onboarding cards. Sleep/Mood/Goal pending Ratner confirmation."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {SUB_SCORE_TOKENS.map((c) => (
              <Swatch key={c.name} {...c} />
            ))}
          </div>
        </Section>

        <Section title="Typography" eyebrow="fonts">
          <div className="space-y-4">
            <FontSample
              label="font-display — Fraunces"
              className="font-display"
            />
            <FontSample label="font-sans — DM Sans" className="font-sans" />
            <FontSample
              label="font-mono — JetBrains Mono (stats)"
              className="font-mono"
            />
          </div>
        </Section>

        <Section title="Font sizes" eyebrow="scale">
          <div className="space-y-2">
            {FONT_SIZE_SAMPLES.map((s) => (
              <div
                key={s.size}
                className="flex items-baseline gap-4 border-b border-border-line py-2"
              >
                <code className="w-20 shrink-0 font-mono text-xs text-text-muted">
                  {s.size}
                </code>
                <span className={`${s.size} truncate`}>The quick brown KAI</span>
                <span className="ml-auto font-mono text-xs text-text-muted">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Border radii" eyebrow="shape">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {RADII.map((r) => (
              <div key={r.name} className="space-y-2">
                <div
                  className={`h-20 w-full border border-glass-border bg-surface-elevated ${r.className}`}
                />
                <div className="space-y-0.5">
                  <div className="font-mono text-xs">{r.name}</div>
                  <div className="font-mono text-xs text-text-muted">
                    {r.px}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Shadows" eyebrow="elevation">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {SHADOWS.map((s) => (
              <div
                key={s.name}
                className={`rounded-glass border border-glass-border bg-surface-elevated p-6 ${s.className}`}
              >
                <div className="font-mono text-sm">{s.name}</div>
                <div className="mt-1 font-mono text-xs text-text-muted">
                  {s.note}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Backdrop blur"
          eyebrow="glass"
          note="Effect is visible against a gradient base."
        >
          <div className="relative overflow-hidden rounded-glass border border-glass-border">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(123,110,246,0.5),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(240,168,104,0.45),transparent_50%)]" />
            <div className="relative grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
              {BLURS.map((b) => (
                <div
                  key={b.name}
                  className={`rounded-glass border border-glass-border bg-surface-glass p-6 ${b.className}`}
                >
                  <div className="font-mono text-sm">{b.name}</div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section
          title="GlassCard"
          eyebrow="primary card surface"
          note="rounded-glass + border-glass-border + bg-surface-glass + backdrop-blur-glass + shadow-glass."
        >
          <div className="relative overflow-hidden rounded-glass">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(104,197,184,0.45),transparent_55%),radial-gradient(circle_at_70%_80%,rgba(240,197,104,0.4),transparent_55%)]" />
            <div className="relative grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
              <div className="rounded-glass border border-glass-border bg-surface-glass p-6 shadow-glass backdrop-blur-glass">
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
                  daily score
                </p>
                <p className="mt-2 font-mono text-5xl font-bold">
                  82<span className="text-text-muted">/100</span>
                </p>
                <p className="mt-2 text-sm text-text-secondary">
                  Mind 7/10 · Sleep 6h · Mood 68
                </p>
              </div>
              <div className="rounded-glass border border-glass-border bg-surface-glass p-6 shadow-glass-lg backdrop-blur-glass-lg">
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
                  reflection
                </p>
                <p className="mt-2 font-display text-2xl leading-snug">
                  Mornings have been rough — anything going on?
                </p>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Keyframe animations" eyebrow="CSS-expressible">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-glass border border-glass-border bg-surface-elevated p-6">
              <p className="font-mono text-xs text-text-muted">
                animate-fade-slide-up
              </p>
              <p className="mt-3 animate-fade-slide-up font-display text-2xl">
                opacity 0→1, translateY 16→0, 380ms
              </p>
            </div>
            <div className="rounded-glass border border-glass-border bg-surface-elevated p-6">
              <p className="font-mono text-xs text-text-muted">
                animate-scale-press
              </p>
              <button className="mt-3 animate-scale-press rounded-md border border-glass-border bg-accent px-5 py-3 font-sans">
                Press 1 → 0.96 → 1
              </button>
            </div>
          </div>
        </Section>

        <Section
          title="Spring presets"
          eyebrow="runtime constants"
          note="Exported from src/lib/animation.ts for Framer Motion's transition prop."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <pre className="overflow-x-auto rounded-md border border-glass-border bg-surface-elevated p-4 font-mono text-xs text-text-secondary">
              {`springSnappy = ${JSON.stringify(springSnappy, null, 2)}`}
            </pre>
            <pre className="overflow-x-auto rounded-md border border-glass-border bg-surface-elevated p-4 font-mono text-xs text-text-secondary">
              {`springGentle = ${JSON.stringify(springGentle, null, 2)}`}
            </pre>
          </div>
        </Section>

        <footer className="mt-16 border-t border-border-line pt-6 font-mono text-xs text-text-muted">
          KAI v2 §7 + v3 patch · T-003 verification page · /_design-tokens
        </footer>
      </div>
    </div>
  );
}

function Section({
  title,
  eyebrow,
  note,
  children,
}: {
  title: string;
  eyebrow: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <div className="mb-4 space-y-1">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
          {eyebrow}
        </p>
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          {title}
        </h2>
        {note ? (
          <p className="text-sm text-text-secondary">{note}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Swatch({
  name,
  className,
  hex,
  note,
}: {
  name: string;
  className: string;
  hex: string;
  note?: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-glass-border bg-surface">
      <div
        className={`h-20 border-b border-glass-border ${className}`}
        aria-hidden
      />
      <div className="space-y-1 px-3 py-2">
        <div className="font-mono text-sm">{name}</div>
        <div className="font-mono text-xs text-text-muted">{hex}</div>
        {note ? (
          <div className="text-xs text-text-secondary">{note}</div>
        ) : null}
      </div>
    </div>
  );
}

function FontSample({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <div className="rounded-lg border border-border-line bg-surface px-5 py-4">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-muted">
        {label}
      </p>
      <p className={`mt-2 text-3xl ${className}`}>
        The quick brown KAI jumps over the lazy fox.
      </p>
      <p className={`mt-1 text-base ${className} text-text-secondary`}>
        abcdefghijklmnopqrstuvwxyz · 0123456789 · ?!&amp;@$
      </p>
    </div>
  );
}
