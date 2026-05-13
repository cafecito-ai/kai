import { lazy, type ComponentType, type LazyExoticComponent } from "react";

/**
 * Single source of truth for the topic guides nested under each engine.
 *
 * Each engine page (Physical / Potential / Mental) shows an
 * `<EngineGuidesIndex engine="..." />` section that renders cards for
 * every entry whose engine matches. Clicking a card routes to
 * `/engine/<engine>/guides/<slug>`, which `GuidePage` resolves by
 * looking up the slug here and rendering the lazy-loaded component.
 *
 * Each primer PR adds one entry to this registry. No App.tsx changes
 * per PR — routes are handled by the single dynamic route in App.tsx.
 *
 * Why lazy: the bundle would balloon if every primer was eagerly
 * imported. Article-catalog primers are large strings; loading on
 * navigation keeps the initial bundle small.
 */

export type GuideEngine = "physical" | "potential" | "mental";

export type GuideEntry = {
  engine: GuideEngine;
  slug: string;
  title: string;
  summary: string;
  /** Persistent danger card shown when sensitive is true. The Crisis
   * page link is still always present in the AppShell footer. */
  sensitive?: boolean;
  /** Medical-adjacent content (anatomy, puberty, nutrition, body
   * function) that should sit behind a clinical-review notice until
   * D5 review is complete. Codex review flagged body-literacy
   * specifically; same banner pattern as the mental engine surfaces. */
  clinicalReview?: boolean;
  /** Lazy-loaded component to render in the guide page. Primer components
   * are heterogeneous (each owns its own Props shape), but they're rendered
   * without parent-supplied props inside `GuidePage`. We type the registry
   * permissively so registry entries can hold any zero-required-prop
   * component without each primer having to opt into a uniform shape. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: LazyExoticComponent<ComponentType<any>>;
};

/**
 * GUIDES is populated by individual primer PRs as they land. The
 * scaffold PR keeps this empty by design — adding entries here is
 * the per-PR contract for surfacing a guide.
 *
 * To add a guide:
 *   1. Add an import-style lazy() entry below.
 *   2. Add a `{ engine, slug, title, summary, sensitive?, component }`
 *      object to GUIDES.
 *   3. Done — the engine hub shows the card; the route resolves it.
 */
export const GUIDES: GuideEntry[] = [
  {
    engine: "physical",
    slug: "body-literacy",
    title: "Body literacy",
    summary: "How the teen body actually works — growth, energy, hydration, hormones, body changes, recovery.",
    clinicalReview: true,
    component: lazy(() =>
      import("../components/physical/BodyLiteracy").then((m) => ({ default: m.BodyLiteracy }))
    )
  },
  {
    engine: "physical",
    slug: "nutrition",
    title: "Nutrition + fueling",
    summary: "Real-food framing, sport fueling, intuitive eating, debunking diet-culture myths.",
    clinicalReview: true,
    component: lazy(() =>
      import("../components/physical/NutritionPrimer").then((m) => ({ default: m.NutritionPrimer }))
    )
  },
  {
    engine: "physical",
    slug: "digital-wellbeing",
    title: "Digital wellbeing",
    summary: "Screens, scrolling, sleep, focus, social comparison — and what helps reclaim agency.",
    component: lazy(() =>
      import("../components/physical/DigitalWellbeing").then((m) => ({ default: m.DigitalWellbeing }))
    )
  },
  {
    engine: "physical",
    slug: "cycle",
    title: "Cycle tracker",
    summary: "If you have a cycle, the pattern is useful. Opt-in, on-device only — never sent anywhere.",
    component: lazy(() =>
      import("../components/physical/CycleTracker").then((m) => ({ default: m.CycleTracker }))
    )
  },
  {
    engine: "physical",
    slug: "hydration",
    title: "Hydration",
    summary: "A nudge to sip. No streaks, no goals. Pee color is the real signal.",
    component: lazy(() =>
      import("../components/physical/HydrationTracker").then((m) => ({ default: m.HydrationTracker }))
    )
  },
  {
    engine: "physical",
    slug: "screen-time",
    title: "Screen time",
    summary: "Your pattern, not a target. Log daily; we'll show shifts week-over-week without scoring you.",
    component: lazy(() =>
      import("../components/physical/ScreenTimeTracker").then((m) => ({ default: m.ScreenTimeTracker }))
    )
  },
  {
    engine: "physical",
    slug: "breath-recommender",
    title: "Breath recommender",
    summary: "Different breath for different feelings. Tap how you feel, get the pattern that fits, then run it guided.",
    component: lazy(() =>
      import("../components/physical/BreathRecommender").then((m) => ({ default: m.BreathRecommender }))
    )
  },
  {
    engine: "physical",
    slug: "daily-rhythm",
    title: "Daily rhythm",
    summary: "Lay out your day. School-day and weekend templates, editable durations, sleep-window math built in.",
    component: lazy(() =>
      import("../components/physical/RhythmBuilder").then((m) => ({ default: m.RhythmBuilder }))
    )
  },
  {
    engine: "potential",
    slug: "focus-and-study",
    title: "Focus + study",
    summary: "Multitasking myth, time blocks, study environment, retrieval practice + spaced repetition.",
    component: lazy(() =>
      import("../components/physical/FocusStudyPrimer").then((m) => ({ default: m.FocusStudyPrimer }))
    )
  },
  {
    engine: "potential",
    slug: "money",
    title: "Money + financial pressure",
    summary: "Real money skills the school skipped — plus an honest look at family stress, college costs, and predatory products.",
    component: lazy(() =>
      import("../components/physical/MoneyPrimer").then((m) => ({ default: m.MoneyPrimer }))
    )
  }
];

export function findGuide(engine: string, slug: string): GuideEntry | undefined {
  return GUIDES.find((g) => g.engine === engine && g.slug === slug);
}

export function guidesForEngine(engine: GuideEngine): GuideEntry[] {
  return GUIDES.filter((g) => g.engine === engine);
}

// Re-export `lazy` so primer PRs can register components without
// re-importing react in the same line as the registry entry.
export { lazy };
