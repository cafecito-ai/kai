import { ChevronRight, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { guidesForEngine, type GuideEngine } from "../../lib/guides-registry";

type Props = {
  engine: GuideEngine;
  /** Section heading (eyebrow). Defaults to "Guides". */
  eyebrow?: string;
  /** Section title. Defaults to a generic "Topic guides" label. */
  title?: string;
  /** Section intro copy. Default is a short generic line. */
  intro?: string;
};

/**
 * Renders a card grid of all guides registered for an engine. Each
 * card links to the dynamic guide page.
 *
 * If the registry is empty for this engine (no PRs landed yet),
 * renders nothing — the engine hub stays clean.
 */
export function EngineGuidesIndex({ engine, eyebrow = "guides", title = "Topic guides", intro }: Props) {
  const guides = guidesForEngine(engine);
  if (guides.length === 0) return null;
  const featured = guides.slice(0, 4);

  const introCopy =
    intro ??
    "Short reads on specific topics. Each one is meant to be useful in 3-5 minutes, not exhaustive.";

  return (
    <section className="rounded-calm border border-line bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <span>
          <span className="eyebrow block">{eyebrow}</span>
          <span className="mt-2 block font-display text-2xl font-black tracking-normal">{title}</span>
          <span className="mt-2 block text-sm leading-6 text-muted">{introCopy}</span>
        </span>
        <span className="shrink-0 rounded-full border border-line bg-paper px-3 py-2 text-xs font-black text-muted">
          {guides.length} reads
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {featured.map((g) => (
          <Link key={g.slug} to={`/engine/${engine}/guides/${g.slug}`} className="focus-ring rounded-kai border border-line bg-paper px-3 py-2 text-sm font-black hover:border-ink/35">
            {g.title}
          </Link>
        ))}
      </div>

      <details className="group mt-3">
        <summary className="focus-ring inline-flex cursor-pointer list-none rounded-full border border-line bg-white px-4 py-2 text-sm font-black text-muted group-open:bg-ink group-open:text-paper">
          Browse all
        </summary>

        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {guides.map((g) => (
            <li key={g.slug}>
              <Link
                to={`/engine/${engine}/guides/${g.slug}`}
                className="focus-ring flex h-full items-start justify-between gap-3 rounded-kai border border-line bg-paper p-4 transition hover:border-sage"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-black leading-tight tracking-normal">{g.title}</p>
                  <p className="mt-1 text-sm leading-5 text-muted">{g.summary}</p>
                  {g.sensitive && (
                    <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-danger">
                      <ShieldAlert size={12} aria-hidden="true" />
                      Sensitive
                    </p>
                  )}
                </div>
                <ChevronRight className="mt-1 text-muted" size={18} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
