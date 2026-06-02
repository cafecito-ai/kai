// /preview/flower — visual demo of the FlowerProgressBar at every stage.
//
// Not linked from any nav. Useful for:
//   - Showing the bloom moment without having to actually complete a
//     7-day challenge in real data
//   - Eyeballing the design at all states side-by-side
//   - Sending Ratner / Lev a link to review the animation
//
// Plain data, no localStorage, no API — visiting this page never
// changes anything in the user's state.

import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { FlowerProgressBar, type FlowerCategory } from "../components/FlowerProgressBar";
import { KaiOrb } from "../components/KaiOrb";

const STATES = [
  { value: 0, target: 7, label: "Day 0 of 7 — fresh start" },
  { value: 1, target: 7, label: "Day 1 of 7 — first sprout" },
  { value: 3, target: 7, label: "Day 3 of 7 — first leaf" },
  { value: 5, target: 7, label: "Day 5 of 7 — second leaf, getting there" },
  { value: 6, target: 7, label: "Day 6 of 7 — petals starting to open" },
  { value: 7, target: 7, label: "Day 7 of 7 — full bloom" },
];

const CATEGORIES: Array<{ id: FlowerCategory; label: string; vibe: string }> = [
  { id: "morning", label: "Morning", vibe: "marigold orange" },
  { id: "evening", label: "Evening", vibe: "violet purple" },
  { id: "body", label: "Body", vibe: "rose red" },
  { id: "mind", label: "Mind", vibe: "forget-me-not teal" },
  { id: "anchor", label: "Anchor", vibe: "clover green" },
];

export function PreviewFlower() {
  return (
    <div className="mx-auto w-full max-w-md px-5 pt-2 pb-12 sm:max-w-lg">
      <header className="flex items-center justify-between pb-3">
        <Link
          to="/home"
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted focus-ring"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
          preview · flower bar
        </p>
        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      <div className="pb-6 text-center">
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
          Flower bar, every stage
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          What you'd see across a 7-day challenge, day by day.
        </p>
      </div>

      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
        growth stages · anchor (clover)
      </p>
      <section className="space-y-3">
        {STATES.map((s) => (
          <article
            key={`${s.value}-${s.target}`}
            className="rounded-lg border border-glass-border bg-surface p-4 shadow-card"
          >
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
              {s.label}
            </p>
            <FlowerProgressBar
              value={s.value}
              target={s.target}
              category="anchor"
              ariaLabel={s.label}
              className="text-text-secondary"
            />
          </article>
        ))}
      </section>

      {/* All five challenge categories at full bloom — so you can see
          which flower matches which kind of challenge. */}
      <p className="mt-8 mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
        full bloom · per category
      </p>
      <section className="space-y-3">
        {CATEGORIES.map((cat) => (
          <article
            key={cat.id}
            className="rounded-lg border border-glass-border bg-surface p-4 shadow-card"
          >
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
              {cat.label} · {cat.vibe}
            </p>
            <FlowerProgressBar
              value={7}
              target={7}
              category={cat.id}
              ariaLabel={`${cat.label} full bloom`}
              className="text-text-secondary"
            />
          </article>
        ))}
      </section>

      {/* Mid-growth comparison — see how the bud color matches the bloom
          across all five flowers. */}
      <p className="mt-8 mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
        mid-growth · 4 of 7
      </p>
      <section className="space-y-3">
        {CATEGORIES.map((cat) => (
          <article
            key={cat.id}
            className="rounded-lg border border-glass-border bg-surface p-4 shadow-card"
          >
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
              {cat.label}
            </p>
            <FlowerProgressBar
              value={4}
              target={7}
              category={cat.id}
              ariaLabel={`${cat.label} 4 of 7`}
              className="text-text-secondary"
            />
          </article>
        ))}
      </section>

      {/* Bonus — KAI orb with the new face, since you're already here. */}
      <section className="mt-10">
        <p className="mb-3 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
          KAI · with face
        </p>
        <div className="flex flex-wrap items-end justify-center gap-6">
          <div className="text-center">
            <KaiOrb size={32} />
            <p className="mt-2 font-mono text-[9px] text-text-muted">32px · no face</p>
          </div>
          <div className="text-center">
            <KaiOrb size={64} />
            <p className="mt-2 font-mono text-[9px] text-text-muted">64px · no face</p>
          </div>
          <div className="text-center">
            <KaiOrb size={96} />
            <p className="mt-2 font-mono text-[9px] text-text-muted">96px · face</p>
          </div>
          <div className="text-center">
            <KaiOrb size={160} />
            <p className="mt-2 font-mono text-[9px] text-text-muted">160px · face</p>
          </div>
        </div>
      </section>
    </div>
  );
}
