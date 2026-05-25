import { ArrowLeft, LifeBuoy } from "lucide-react";
import { Suspense } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ClinicalReviewBanner } from "../components/mental/ClinicalReviewBanner";
import { CrisisLink } from "../components/shared/CrisisLink";
import { AppPage } from "../components/ui/AppPrimitives";
import { findGuide, type GuideEngine } from "../lib/guides-registry";

const ENGINE_LABELS: Record<GuideEngine, string> = {
  physical: "Health unit",
  potential: "Goals unit",
  mental: "Mental unit"
};

/**
 * Dynamic guide page. Mounted at `/engine/:engineId/guides/:slug`.
 *
 * Looks up the slug in the GUIDES registry; renders the lazy-loaded
 * component. Shows a back link to the engine hub plus the sensitive-
 * content danger card for primers marked sensitive=true.
 */
export function GuidePage() {
  const { engineId, slug } = useParams<{ engineId: string; slug: string }>();
  if (!engineId || !slug) return <Navigate to="/home" replace />;

  const guide = findGuide(engineId, slug);
  if (!guide) return <Navigate to={engineId === "physical" ? "/health" : engineId === "potential" ? "/engine/potential" : "/mental"} replace />;

  const engineLabel = ENGINE_LABELS[guide.engine];
  const Component = guide.component;

  return (
    <AppPage className="max-w-3xl">
      <nav className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted">
        <Link
          to={guide.engine === "physical" ? "/health" : guide.engine === "potential" ? "/engine/potential" : "/mental"}
          className="focus-ring inline-flex items-center gap-1 rounded-kai border border-line bg-white px-3 py-1.5 text-muted hover:border-sage hover:text-sage"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to {engineLabel}
        </Link>
        <Link
          to="/crisis"
          className="focus-ring inline-flex items-center gap-1 rounded-kai border border-line bg-white px-3 py-1.5 text-muted hover:border-danger hover:text-danger"
        >
          <LifeBuoy size={14} aria-hidden="true" />
          Crisis
        </Link>
      </nav>

      {guide.clinicalReview && <ClinicalReviewBanner />}
      {guide.sensitive && <CrisisLink tone="danger" />}

      <Suspense fallback={<GuideLoading />}>
        <Component />
      </Suspense>
    </AppPage>
  );
}

function GuideLoading() {
  return (
    <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
      <p className="text-sm text-muted">Loading guide…</p>
    </section>
  );
}
