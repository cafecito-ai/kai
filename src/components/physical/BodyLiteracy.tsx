import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";
import { scrubProgressEvent } from "../../lib/sensitive-events";
import { useProgressStore } from "../../stores/progressStore";
import { ArticleBody } from "../shared/ArticleBody";
import {
  BODY_LITERACY_ARTICLES,
  BODY_LITERACY_CATEGORY_LABEL,
  type BodyLiteracyArticle,
  type BodyLiteracyCategory
} from "../../lib/body-literacy";

type Props = {
  /** Optional handler. If omitted, the component logs reads directly to the
   * progress store under engine=physical / type=body_literacy_read.
   * Set when the caller wants different routing (e.g., the parent already
   * has its own optimistic-entry pipeline). */
  onRead?: (input: { articleId: string }) => void;
};

const CATEGORY_ORDER: BodyLiteracyCategory[] = [
  "growth",
  "energy",
  "hydration",
  "hormones",
  "body_changes",
  "recovery"
];

/**
 * Body literacy primer surface — readable articles in plain language about
 * how the teen body actually works. Each article is collapsible (closed by
 * default; the title + summary visible, body expands on click).
 *
 * onRead fires once per session per article when expanded — gives the host
 * page a hook to log engagement without spamming entries.
 */
export function BodyLiteracy({ onRead }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [readSet, setReadSet] = useState<Set<string>>(new Set());
  const addEvent = useProgressStore((state) => state.addEvent);

  const grouped = useMemo(() => {
    const byCat: Record<BodyLiteracyCategory, BodyLiteracyArticle[]> = {
      growth: [],
      energy: [],
      hydration: [],
      hormones: [],
      body_changes: [],
      recovery: []
    };
    for (const article of BODY_LITERACY_ARTICLES) byCat[article.category].push(article);
    return byCat;
  }, []);

  function toggle(article: BodyLiteracyArticle) {
    if (openId === article.id) {
      setOpenId(null);
      return;
    }
    setOpenId(article.id);
    if (!readSet.has(article.id)) {
      const next = new Set(readSet);
      next.add(article.id);
      setReadSet(next);
      if (onRead) {
        onRead({ articleId: article.id });
      } else {
        // Default progress wiring when no parent handler is supplied
        // (used when this component is mounted via a guide page).
        addEvent(
          scrubProgressEvent({
            engine: "physical" as const,
            eventType: "body_literacy_read",
            eventValue: 8,
            payload: { articleId: article.id }
          })
        );
      }
    }
  }

  return (
    <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
      <div className="mb-5 grid size-12 place-items-center rounded-full bg-lime text-sage">
        <BookOpen />
      </div>
      <p className="eyebrow">body literacy</p>
      <h2 className="mt-2 font-display text-3xl font-black tracking-normal">How your body actually works.</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Short, readable, no diagnosis. Tap a card to expand.
      </p>

      <div className="mt-4 space-y-4">
        {CATEGORY_ORDER.map((cat) => {
          const items = grouped[cat];
          if (items.length === 0) return null;
          return (
            <div key={cat}>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">
                {BODY_LITERACY_CATEGORY_LABEL[cat]}
              </p>
              <div className="mt-2 space-y-2">
                {items.map((article) => {
                  const isOpen = openId === article.id;
                  return (
                    <article
                      key={article.id}
                      className="rounded-kai border border-line bg-paper transition"
                    >
                      <button
                        type="button"
                        onClick={() => toggle(article)}
                        aria-expanded={isOpen}
                        className="focus-ring flex w-full items-start justify-between gap-3 p-4 text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display text-lg font-black tracking-normal">{article.title}</h3>
                          <p className="mt-1 text-sm leading-5 text-muted">{article.summary}</p>
                          <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-muted">
                            {article.readMinutes} min read
                          </p>
                        </div>
                        {isOpen ? <ChevronUp className="mt-1 text-sage" size={18} aria-hidden="true" /> : <ChevronDown className="mt-1 text-muted" size={18} aria-hidden="true" />}
                      </button>
                      {isOpen && (
                        <div className="border-t border-line p-4">
                          <ArticleBody body={article.body} />
                          {article.takeaways.length > 0 && (
                            <div className="mt-4 rounded-kai border border-sage/30 bg-lime p-3">
                              <p className="text-xs font-bold uppercase tracking-wider text-sage">Takeaways</p>
                              <ul className="mt-2 space-y-1 text-sm leading-5 text-ink">
                                {article.takeaways.map((point, idx) => (
                                  <li key={idx} className="flex gap-2">
                                    <span className="text-sage">•</span>
                                    <span>{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
