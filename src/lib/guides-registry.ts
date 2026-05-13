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
  /** Lazy-loaded component to render in the guide page. */
  component: LazyExoticComponent<ComponentType<unknown>>;
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
export const GUIDES: GuideEntry[] = [];

export function findGuide(engine: string, slug: string): GuideEntry | undefined {
  return GUIDES.find((g) => g.engine === engine && g.slug === slug);
}

export function guidesForEngine(engine: GuideEngine): GuideEntry[] {
  return GUIDES.filter((g) => g.engine === engine);
}

// Re-export `lazy` so primer PRs can register components without
// re-importing react in the same line as the registry entry.
export { lazy };
