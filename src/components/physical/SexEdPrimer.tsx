import { BookOpen, ChevronDown, ChevronUp, LifeBuoy } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  BEDSIDER_URL,
  PLANNED_PARENTHOOD_HOTLINE,
  RAINN_HOTLINE_SEX_ED,
  SCARLETEEN_URL,
  SEX_ED_ARTICLES,
  SEX_ED_CATEGORY_LABEL,
  type SexEdArticle,
  type SexEdCategory
} from "../../lib/sex-ed-primer";

type Props = {
  onRead?: (input: { articleId: string }) => void;
};

const CATEGORY_ORDER: SexEdCategory[] = [
  "bodies_and_puberty",
  "consent_foundations",
  "contraception_basics",
  "sti_awareness",
  "pleasure_and_communication",
  "resources_and_help"
];

export function SexEdPrimer({ onRead }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [readSet, setReadSet] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const byCat: Record<SexEdCategory, SexEdArticle[]> = {
      bodies_and_puberty: [],
      consent_foundations: [],
      contraception_basics: [],
      sti_awareness: [],
      pleasure_and_communication: [],
      resources_and_help: []
    };
    for (const article of SEX_ED_ARTICLES) byCat[article.category].push(article);
    return byCat;
  }, []);

  function toggle(article: SexEdArticle) {
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
        <BookOpen />
      </div>
      <p className="eyebrow">sex education + bodies</p>
      <h2 className="mt-2 font-display text-3xl font-black tracking-normal">Factual, inclusive, harm-reduction.</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Most school sex ed leaves big gaps. This is the version that's clinically accurate, inclusive of all bodies and orientations, and doesn't moralize about your choices.
      </p>

      <div className="mt-3 rounded-kai border border-sage/30 bg-lime/40 p-3">
        <p className="text-xs font-bold uppercase tracking-wider text-sage">Real resources, no shame</p>
        <p className="mt-1 text-sm leading-5 text-ink">
          Scarleteen: <strong>{SCARLETEEN_URL}</strong>. Planned Parenthood: <strong>{PLANNED_PARENTHOOD_HOTLINE}</strong>. Contraception comparison: <strong>{BEDSIDER_URL}</strong>. Sexual assault: <strong>{RAINN_HOTLINE_SEX_ED}</strong>.
        </p>
        <Link
          to="/crisis"
          className="focus-ring mt-2 inline-flex items-center gap-1 rounded-kai border border-sage/40 bg-white px-3 py-1.5 text-xs font-bold text-sage hover:bg-sage/10"
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
                {SEX_ED_CATEGORY_LABEL[cat]}
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
