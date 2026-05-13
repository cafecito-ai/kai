import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import {
  GRAT_ARTICLES,
  GRAT_CATEGORY_LABEL,
  type GratArticle,
  type GratCategory
} from "../../lib/gratitude-primer";

type Props = {
  onRead?: (input: { articleId: string }) => void;
};

const CATEGORY_ORDER: GratCategory[] = [
  "why_it_works",
  "daily_practice",
  "savoring",
  "letter_writing",
  "hard_weeks",
  "for_others"
];

export function GratitudePrimer({ onRead }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [readSet, setReadSet] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const byCat: Record<GratCategory, GratArticle[]> = {
      why_it_works: [],
      daily_practice: [],
      savoring: [],
      letter_writing: [],
      hard_weeks: [],
      for_others: []
    };
    for (const article of GRAT_ARTICLES) byCat[article.category].push(article);
    return byCat;
  }, []);

  function toggle(article: GratArticle) {
    if (openId === article.id) {
      setOpenId(null);
      return;
    }
    setOpenId(article.id);
    if (!readSet.has(article.id)) {
      const next = new Set(readSet);
      next.add(article.id);
      setReadSet(next);
      onRead?.({ articleId: article.id });
    }
  }

  return (
    <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
      <div className="mb-5 grid size-12 place-items-center rounded-full bg-lime text-sage">
        <Sparkles />
      </div>
      <p className="eyebrow">gratitude + savoring</p>
      <h2 className="mt-2 font-display text-3xl font-black tracking-normal">Small lever, not magic.</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Gratitude and savoring are real practices with real (small-to-medium) effects. They aren't a substitute for actual help when things are hard.
      </p>

      <div className="mt-4 space-y-4">
        {CATEGORY_ORDER.map((cat) => {
          const items = grouped[cat];
          if (items.length === 0) return null;
          return (
            <div key={cat}>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">
                {GRAT_CATEGORY_LABEL[cat]}
              </p>
              <div className="mt-2 space-y-2">
                {items.map((article) => {
                  const isOpen = openId === article.id;
                  return (
                    <article key={article.id} className="rounded-kai border border-line bg-paper transition">
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
                        {isOpen ? (
                          <ChevronUp className="mt-1 text-sage" size={18} aria-hidden="true" />
                        ) : (
                          <ChevronDown className="mt-1 text-muted" size={18} aria-hidden="true" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="border-t border-line p-4">
                          <div className="space-y-3 text-sm leading-6 text-ink">
                            {article.body.split("\n\n").map((paragraph, idx) => (
                              <p key={idx}>{paragraph}</p>
                            ))}
                          </div>
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
