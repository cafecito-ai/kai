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

  const introCopy =
    intro ??
    "Short reads on specific topics. Each one is meant to be useful in 3-5 minutes, not exhaustive.";

  return (
    <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-2 font-display text-2xl font-black tracking-normal">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{introCopy}</p>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
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
    </section>
  );
}
