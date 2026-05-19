// /_design-tokens — visual reference for the KAI light design system.
// Lives outside auth so the team can review tokens + see a Home mockup
// without signing in.

import {
  Activity,
  Brain,
  Heart,
  Moon,
  Plus,
  Sparkles,
  Sun,
} from "lucide-react";

import { KaiMessage } from "../components/KaiMessage";
import { KaiOrb } from "../components/KaiOrb";
import { ScoreRing } from "../components/ScoreRing";
import { springGentle, springSnappy } from "../lib/animation";

// ─────────────────────────────────────────────────────────────────────
// Token catalogues
// ─────────────────────────────────────────────────────────────────────

const COLOR_TOKENS = [
  { name: "background", className: "bg-background", hex: "#FAFAF7" },
  { name: "surface", className: "bg-surface", hex: "#FFFFFF" },
  {
    name: "surface-muted",
    className: "bg-surface-muted",
    hex: "#F4F1EB",
    note: "grouping blocks",
  },
  {
    name: "surface-glass",
    className: "bg-surface-glass",
    hex: "rgba(255,255,255,0.72)",
    note: "frosted card",
  },
  { name: "accent", className: "bg-accent", hex: "#7B6EF6" },
  { name: "accent-warm", className: "bg-accent-warm", hex: "#F0A868" },
  { name: "accent-cool", className: "bg-accent-cool", hex: "#68C5B8" },
  {
    name: "accent-soft",
    className: "bg-accent-soft",
    hex: "#EEEBFE",
    note: "tinted chip bg",
  },
  {
    name: "accent-warm-soft",
    className: "bg-accent-warm-soft",
    hex: "#FDF1E4",
  },
  {
    name: "accent-cool-soft",
    className: "bg-accent-cool-soft",
    hex: "#E4F4F1",
  },
  { name: "text-primary", className: "bg-text-primary", hex: "#1A1A1F" },
  { name: "text-secondary", className: "bg-text-secondary", hex: "#5A5A60" },
  { name: "text-muted", className: "bg-text-muted", hex: "#8A8A8F" },
  { name: "success", className: "bg-success", hex: "#3F9D6A" },
  { name: "warning", className: "bg-warning", hex: "#D89A2C" },
  { name: "danger", className: "bg-danger", hex: "#C75555" },
] as const;

const SCORE_THRESHOLDS = [
  { range: "0–40", className: "bg-score-low", hex: "#E8AE40", label: "Easy day" },
  { range: "41–70", className: "bg-score-mid", hex: "#7B6EF6", label: "Steady" },
  { range: "71–100", className: "bg-score-high", hex: "#3F9D6A", label: "Strong" },
];

const SUB_SCORE_TOKENS = [
  { name: "mental", className: "bg-mental", hex: "#68C5B8" },
  { name: "physical", className: "bg-physical", hex: "#F0A868" },
  { name: "sleep", className: "bg-sleep", hex: "#7B6EF6" },
  { name: "mood", className: "bg-mood", hex: "#E8AE40" },
  { name: "goal", className: "bg-goal", hex: "#3F9D6A" },
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
];

const RADII = [
  { name: "sm", className: "rounded-sm", px: "10px" },
  { name: "md", className: "rounded-md", px: "16px" },
  { name: "lg", className: "rounded-lg", px: "24px" },
  { name: "xl", className: "rounded-xl", px: "32px" },
  { name: "full", className: "rounded-full", px: "9999px" },
];

const SHADOWS = [
  { name: "shadow-card", className: "shadow-card", note: "base card depth" },
  {
    name: "shadow-card-lg",
    className: "shadow-card-lg",
    note: "elevated card",
  },
  { name: "shadow-glass", className: "shadow-glass", note: "frosted overlay" },
  {
    name: "shadow-glass-lg",
    className: "shadow-glass-lg",
    note: "modal / hero",
  },
];

// ─────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────

export function DesignTokens() {
  return (
    <div className="min-h-screen bg-background font-sans text-text-primary">
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <header className="mb-12 space-y-3">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">
            KAI / design tokens
          </p>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Built for trust.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-text-secondary">
            Light, warm and quietly premium. The kind of app a teen will open
            every morning — and a parent will recognize as legitimate.
          </p>
        </header>

        {/* Signature elements come first — the parts of KAI nobody else has. */}
        <SignatureSection />

        {/* The hero mockup is the proof of the system, shown before the parts. */}
        <HomeMockup />

        <Section title="Colors" eyebrow="palette">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {COLOR_TOKENS.map((c) => (
              <Swatch key={c.name} {...c} />
            ))}
          </div>
        </Section>

        <Section
          title="Daily Score thresholds"
          eyebrow="v3 §2"
          note="Never red. Soft amber when the day was hard, violet when it was steady, green when it was strong."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {SCORE_THRESHOLDS.map((t) => (
              <div
                key={t.range}
                className="overflow-hidden rounded-lg border border-glass-border bg-surface shadow-card"
              >
                <div className={`h-24 ${t.className}`} />
                <div className="space-y-1 px-5 py-4">
                  <div className="font-mono text-base font-medium">
                    {t.range}
                  </div>
                  <div className="font-display text-lg leading-snug">
                    {t.label}
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
          note="Mind=cool, Body=warm match v3 §4 onboarding cards. Sleep / Mood / Goal mapped to score-threshold colors for now — Ratner to confirm."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {SUB_SCORE_TOKENS.map((c) => (
              <Swatch key={c.name} {...c} />
            ))}
          </div>
        </Section>

        <Section title="Typography" eyebrow="fonts">
          <div className="space-y-4">
            <FontSample
              label="font-display — Fraunces"
              note="Display, headings, soulful moments. Serif gives quiet authority."
              className="font-display"
            />
            <FontSample
              label="font-sans — DM Sans"
              note="Body, UI, every paragraph. Modern, neutral, readable."
              className="font-sans"
            />
            <FontSample
              label="font-mono — JetBrains Mono"
              note="Stats, score numbers, timestamps. Tabular feel without being cold."
              className="font-mono"
            />
          </div>
        </Section>

        <Section title="Font sizes" eyebrow="scale">
          <div className="overflow-hidden rounded-lg border border-glass-border bg-surface shadow-card">
            {FONT_SIZE_SAMPLES.map((s, i) => (
              <div
                key={s.size}
                className={`flex items-baseline gap-4 px-5 py-3 ${
                  i < FONT_SIZE_SAMPLES.length - 1
                    ? "border-b border-border-line"
                    : ""
                }`}
              >
                <code className="w-24 shrink-0 font-mono text-xs text-text-muted">
                  {s.size}
                </code>
                <span className={`${s.size} truncate`}>
                  The quick brown KAI
                </span>
                <span className="ml-auto font-mono text-xs text-text-muted">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Border radii" eyebrow="shape">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {RADII.map((r) => (
              <div key={r.name} className="space-y-2">
                <div
                  className={`h-24 w-full border border-glass-border bg-surface shadow-card ${r.className}`}
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {SHADOWS.map((s) => (
              <div
                key={s.name}
                className={`rounded-lg border border-glass-border bg-surface p-6 ${s.className}`}
              >
                <div className="font-mono text-sm font-medium">{s.name}</div>
                <div className="mt-1 text-sm text-text-secondary">
                  {s.note}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Motion" eyebrow="animation presets">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-glass-border bg-surface p-6 shadow-card">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-muted">
                animate-fade-slide-up
              </p>
              <p className="mt-3 animate-fade-slide-up font-display text-2xl">
                opacity 0→1, translateY 16→0, 380ms
              </p>
            </div>
            <div className="rounded-lg border border-glass-border bg-surface p-6 shadow-card">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-muted">
                animate-breathe
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span className="inline-flex h-10 w-10 animate-breathe items-center justify-center rounded-full bg-accent-soft">
                  <Sparkles className="h-5 w-5 text-accent" />
                </span>
                <span className="text-text-secondary">
                  Subtle 4s loop for hero moments
                </span>
              </div>
            </div>
            <pre className="overflow-x-auto rounded-lg border border-glass-border bg-surface p-4 font-mono text-xs text-text-secondary shadow-card">
              {`springSnappy = ${JSON.stringify(springSnappy, null, 2)}`}
            </pre>
            <pre className="overflow-x-auto rounded-lg border border-glass-border bg-surface p-4 font-mono text-xs text-text-secondary shadow-card">
              {`springGentle = ${JSON.stringify(springGentle, null, 2)}`}
            </pre>
          </div>
        </Section>

        <footer className="mt-16 border-t border-border-line pt-6 font-mono text-xs text-text-muted">
          KAI light system · T-003 verification page · /_design-tokens
        </footer>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// HomeMockup — what the real app will feel like on a phone
// ─────────────────────────────────────────────────────────────────────

function HomeMockup() {
  return (
    <section className="mb-16">
      <div className="mb-5 space-y-1">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
          home screen
        </p>
        <h2 className="font-display text-3xl font-semibold tracking-tight">
          What KAI will look like
        </h2>
        <p className="text-sm text-text-secondary">
          Sample home screen at iPhone width (375px). Live components — not a
          Figma mock.
        </p>
      </div>

      <div className="flex justify-center">
        <PhoneFrame>
          <HomeContent />
        </PhoneFrame>
      </div>
    </section>
  );
}

function SignatureSection() {
  return (
    <section className="mb-16">
      <div className="mb-5 space-y-1">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
          signature elements
        </p>
        <h2 className="font-display text-3xl font-semibold tracking-tight">
          The three things only KAI has.
        </h2>
        <p className="max-w-2xl text-sm text-text-secondary">
          The orb gives KAI a face. The score ring uses color to communicate
          how the day is going. The message bubbles feel like a friend texting,
          not an interface.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Card 1 — The orb */}
        <div className="rounded-glass border border-glass-border bg-surface p-6 shadow-card">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
            KAI orb
          </p>
          <div className="my-6 flex items-end justify-center gap-6 pt-2">
            <div className="flex flex-col items-center gap-2">
              <KaiOrb size={28} />
              <p className="font-mono text-[10px] text-text-muted">28</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <KaiOrb size={56} />
              <p className="font-mono text-[10px] text-text-muted">56</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <KaiOrb size={96} />
              <p className="font-mono text-[10px] text-text-muted">96</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-text-secondary">
            Used at <strong className="text-text-primary">28px</strong> beside
            messages, <strong className="text-text-primary">56px</strong> in
            the home reflection card, and{" "}
            <strong className="text-text-primary">180–240px</strong> as the
            voice-mode hero. Breathes on a 4s loop.
          </p>
        </div>

        {/* Card 2 — Score ring */}
        <div className="rounded-glass border border-glass-border bg-surface p-6 shadow-card">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
            Daily Score ring
          </p>
          <div className="my-2 flex items-center justify-center gap-4 pt-4">
            <div className="flex flex-col items-center gap-1.5">
              <ScoreRing value={28} size={64} stroke={6} animate={false} />
              <p className="font-mono text-[10px] text-text-muted">28</p>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <ScoreRing value={58} size={64} stroke={6} animate={false} />
              <p className="font-mono text-[10px] text-text-muted">58</p>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <ScoreRing value={82} size={64} stroke={6} animate={false} />
              <p className="font-mono text-[10px] text-text-muted">82</p>
            </div>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            Same gradient (amber → violet → green) flows along the arc every
            day. The fill amount shows progress; the visible color tells the
            story. Animates in over 900ms on load.
          </p>
        </div>

        {/* Card 3 — Message bubble */}
        <div className="rounded-glass border border-glass-border bg-surface p-6 shadow-card">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
            KAI message
          </p>
          <div className="my-5">
            <KaiMessage timestamp="9:14 AM">
              Mornings have been rough lately. Want to start small today?
            </KaiMessage>
          </div>
          <p className="text-sm leading-relaxed text-text-secondary">
            Reads like a text from a friend who actually pays attention. Tight
            bottom-left corner gives the "speaker side" without a triangle
            tail. KAI's orb anchors the message.
          </p>
        </div>
      </div>
    </section>
  );
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[44px] bg-[#1a1a1f] p-3 shadow-card-lg">
      <div className="overflow-hidden rounded-[34px] bg-background">
        <div className="relative w-[375px] max-w-full">
          {/* Status bar fake */}
          <div className="flex items-center justify-between px-7 pt-4 pb-1 font-mono text-[11px] text-text-primary">
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-text-primary" />
              <span className="h-2 w-3 rounded-sm bg-text-primary" />
              <span className="h-2 w-5 rounded-sm bg-text-primary" />
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function HomeContent() {
  return (
    <div className="relative pb-32">
      <div className="px-5 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
              Tuesday morning
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
              Morning, Lev.
            </h1>
          </div>
          <KaiOrb size={44} />
        </div>
      </div>

      {/* Daily Score hero card */}
      <div className="mt-5 px-5">
        <div className="relative overflow-hidden rounded-glass border border-glass-border bg-surface p-6 shadow-card-lg">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
                Today
              </p>
              <p className="mt-2 flex items-baseline gap-1">
                <span className="font-mono text-6xl font-bold leading-none text-text-primary">
                  82
                </span>
                <span className="font-mono text-xl text-text-muted">/100</span>
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
                <Sparkles className="h-3 w-3" /> Strong start
              </p>
            </div>
            <ScoreRing value={82} size={96} />
          </div>
        </div>
      </div>

      {/* Sub-score row (horizontal scroll on phone — here we just lay flat) */}
      <div className="mt-4 flex gap-3 overflow-x-auto px-5 pb-2">
        <SubScoreCard
          icon={<Brain className="h-4 w-4" />}
          label="Mind"
          value="7"
          unit="/10"
          color="cool"
        />
        <SubScoreCard
          icon={<Moon className="h-4 w-4" />}
          label="Sleep"
          value="6.4"
          unit="hrs"
          color="violet"
        />
        <SubScoreCard
          icon={<Heart className="h-4 w-4" />}
          label="Mood"
          value="68"
          unit=""
          color="warm"
        />
      </div>

      {/* KAI message bubble */}
      <div className="mt-4 px-5">
        <KaiMessage
          timestamp="this morning"
          orbSize={32}
          action={{ label: "Reply" }}
        >
          Slept a little light last night — want to start easy and see how
          today shakes out?
        </KaiMessage>
      </div>

      {/* Activity card */}
      <div className="mt-3 px-5">
        <div className="rounded-glass border border-glass-border bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
              Recent
            </p>
            <button className="text-xs font-medium text-accent">
              See all
            </button>
          </div>
          <div className="mt-3 space-y-3">
            <ActivityRow
              icon={<Activity className="h-4 w-4 text-accent-warm" />}
              title="Easy run · 32 min"
              meta="Yesterday · 6:48 PM"
              chip={{ label: "+5", className: "bg-success-soft text-success" }}
            />
            <ActivityRow
              icon={<Moon className="h-4 w-4 text-accent" />}
              title="Slept 6h 24m"
              meta="Last night"
              chip={{
                label: "—2",
                className: "bg-warning-soft text-warning",
              }}
            />
            <ActivityRow
              icon={<Brain className="h-4 w-4 text-accent-cool" />}
              title="Evening reflection"
              meta="Yesterday · 10:12 PM"
              chip={{ label: "+3", className: "bg-success-soft text-success" }}
            />
          </div>
        </div>
      </div>

      {/* Tab bar — floating glass per v3 §5 (4 tabs + persistent +) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-glass-border bg-surface-glass px-2 py-1.5 shadow-glass-lg backdrop-blur-glass-lg">
          <TabIcon icon={<Sun className="h-5 w-5" />} active label="Home" />
          <TabIcon
            icon={<Activity className="h-5 w-5" />}
            label="Progress"
          />
          <TabIcon icon={<Heart className="h-5 w-5" />} label="Groups" />
          <TabIcon icon={<Brain className="h-5 w-5" />} label="Profile" />
        </div>
        <button className="pointer-events-auto ml-2 flex h-12 w-12 items-center justify-center rounded-full bg-text-primary text-background shadow-card-lg">
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function SubScoreCard({
  icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  color: "cool" | "warm" | "violet";
}) {
  const tint = {
    cool: "bg-accent-cool-soft text-accent-cool",
    warm: "bg-accent-warm-soft text-accent-warm",
    violet: "bg-accent-soft text-accent",
  }[color];
  return (
    <div className="min-w-[120px] flex-1 rounded-lg border border-glass-border bg-surface p-4 shadow-card">
      <div className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${tint}`}>
        {icon}
      </div>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-semibold text-text-primary">
        {value}
        <span className="ml-0.5 text-xs font-medium text-text-muted">
          {unit}
        </span>
      </p>
    </div>
  );
}

function ActivityRow({
  icon,
  title,
  meta,
  chip,
}: {
  icon: React.ReactNode;
  title: string;
  meta: string;
  chip: { label: string; className: string };
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-text-primary">{title}</p>
        <p className="text-xs text-text-muted">{meta}</p>
      </div>
      <span
        className={`rounded-full px-2.5 py-0.5 font-mono text-xs ${chip.className}`}
      >
        {chip.label}
      </span>
    </div>
  );
}

function TabIcon({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      aria-label={label}
      className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
        active
          ? "bg-text-primary text-background"
          : "text-text-secondary hover:bg-surface-muted"
      }`}
    >
      {icon}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Layout helpers
// ─────────────────────────────────────────────────────────────────────

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
    <section className="mb-14">
      <div className="mb-5 space-y-1">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
          {eyebrow}
        </p>
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          {title}
        </h2>
        {note ? (
          <p className="max-w-2xl text-sm text-text-secondary">{note}</p>
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
    <div className="overflow-hidden rounded-lg border border-glass-border bg-surface shadow-card">
      <div
        className={`h-20 border-b border-glass-border ${className}`}
        aria-hidden
      />
      <div className="space-y-1 px-3 py-2.5">
        <div className="font-mono text-sm font-medium">{name}</div>
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
  note,
  className,
}: {
  label: string;
  note: string;
  className: string;
}) {
  return (
    <div className="rounded-lg border border-glass-border bg-surface px-6 py-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-muted">
          {label}
        </p>
        <p className="text-xs text-text-muted">{note}</p>
      </div>
      <p className={`mt-3 text-4xl ${className}`}>
        The quick brown KAI jumps over the lazy fox.
      </p>
      <p className={`mt-1 text-base text-text-secondary ${className}`}>
        abcdefghijklmnopqrstuvwxyz · 0123456789 · ?!&amp;@$
      </p>
    </div>
  );
}
