import { marked } from "marked";
import { useEffect } from "react";
// Imported at build time via Vite's `?raw` query so the page is a static
// render of the doc. Edit docs/SCOPE_2026_05_13.md and the deploy picks it
// up — no separate copy step.
import scopeSource from "../../docs/SCOPE_2026_05_13.md?raw";

marked.use({
  gfm: true,
  breaks: false
});

// Pre-parse at module load. The doc is small enough that synchronous parsing
// is fine, and this avoids the async/Suspense dance on every visit.
const html = marked.parse(scopeSource, { async: false }) as string;

/**
 * Internal scope review page mounted at /scope. Visible without sign-in so
 * Offy + Lev can read it directly. `noindex` keeps it out of search engines
 * — the doc references infra IDs we don't want indexed even though they
 * aren't secrets.
 *
 * Source of truth: docs/SCOPE_2026_05_13.md. The Vite `?raw` import means
 * editing that file is the only step needed to update this page.
 */
export function Scope() {
  useEffect(() => {
    // Set noindex at mount; remove on unmount so other pages keep their
    // own (default-indexable) behavior.
    const tag = document.createElement("meta");
    tag.name = "robots";
    tag.content = "noindex, nofollow";
    document.head.appendChild(tag);
    const prevTitle = document.title;
    document.title = "Kai — Scope & Next Steps";
    return () => {
      tag.remove();
      document.title = prevTitle;
    };
  }, []);

  return (
    <div className="min-h-screen bg-paper py-10">
      <main className="mx-auto max-w-3xl px-5">
        <article
          className="scope-doc text-ink"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <p className="mt-12 border-t border-line pt-6 text-xs text-muted">
          This page renders <code>docs/SCOPE_2026_05_13.md</code> from the repo.
          Edits to the markdown ship on next deploy.
        </p>
      </main>
    </div>
  );
}
