import { ChevronDown, ChevronUp, LifeBuoy, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  SAMHSA_HELPLINE,
  SUBSTANCES_ARTICLES,
  SUBSTANCES_CATEGORY_LABEL,
  type SubstancesArticle,
  type SubstancesCategory
} from "../../lib/substances-primer";

type Props = {
  onRead?: (input: { articleId: string }) => void;
};

const CATEGORY_ORDER: SubstancesCategory[] = [
  "pills_and_counterfeits",
  "friends_and_emergency",
  "vaping_nicotine",
  "alcohol",
  "cannabis",
  "when_use_is_a_problem"
];

export function SubstancesPrimer({ onRead }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [readSet, setReadSet] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const byCat: Record<SubstancesCategory, SubstancesArticle[]> = {
      vaping_nicotine: [],
      alcohol: [],
      cannabis: [],
      pills_and_counterfeits: [],
      friends_and_emergency: [],
      when_use_is_a_problem: []
    };
    for (const article of SUBSTANCES_ARTICLES) byCat[article.category].push(article);
    return byCat;
  }, []);

  function toggle(article: SubstancesArticle) {
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
        <ShieldAlert />
      </div>
      <p className="eyebrow">substances + risk</p>
      <h2 className="mt-2 font-display text-3xl font-black tracking-normal">Harm reduction, not a lecture.</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Honest about real risks. No fear-based exaggeration, no dismissal. Specific medical red flags that save lives. This isn't a substitute for a real adult or clinician.
      </p>

      <div className="mt-3 rounded-kai border border-danger/30 bg-danger/5 p-3">
        <p className="text-xs font-bold uppercase tracking-wider text-danger">If something is happening right now</p>
        <p className="mt-1 text-sm leading-5 text-ink">
          Medical emergency: call <strong>911</strong>. Free anonymous helpline: <strong>{SAMHSA_HELPLINE}</strong>.
        </p>
        <Link
          to="/crisis"
          className="focus-ring mt-2 inline-flex items-center gap-1 rounded-kai border border-danger/40 bg-white px-3 py-1.5 text-xs font-bold text-danger hover:bg-danger/5"
        >
          <LifeBuoy size={14} aria-hidden="true" />
          Crisis page
        </Link>
      </div>

      <div className="mt-4 space-y-4">
        {CATEGORY_ORDER.map((cat) => {
          const items = grouped[cat];
          if (items.length === 0) return null;
          return (
            <div key={cat}>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">
                {SUBSTANCES_CATEGORY_LABEL[cat]}
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
