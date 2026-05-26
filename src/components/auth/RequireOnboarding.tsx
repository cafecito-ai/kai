import { Navigate, useLocation } from "react-router-dom";
import { useUserStore } from "../../stores/userStore";
import { RequireAuth } from "./RequireAuth";

/**
 * Gates routes behind onboarding completion.
 *
 * Reads from `userStore` — AppDataHydrator is the single owner
 * of GET /api/user/me on app mount, so this component must NOT
 * fire its own fetch (that was the double-fetch race fixed in
 * the PR following #109).
 *
 * Behavior matrix:
 *   - hydrated=false       → show loading shell (waiting on hydrator)
 *   - hydrated=true,  completedAt set    → render children
 *   - hydrated=true,  completedAt null   → redirect to /onboarding
 *
 * `hydrated` flips to true after AppDataHydrator's first fetch
 * (success OR failure). On failure we treat it as "no profile" and
 * follow the redirect path, which is correct: a brand-new account
 * has no profile and belongs in onboarding anyway.
 */
export function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const hydrated = useUserStore((state) => state.hydrated);
  const onboardingCompletedAt = useUserStore((state) => state.onboardingCompletedAt);

  let content: React.ReactNode;
  if (!hydrated) {
    content = <LoadingShell />;
  } else if (onboardingCompletedAt) {
    content = children;
  } else {
    content = <Navigate to="/onboarding" replace state={{ from: location.pathname }} />;
  }

  return <RequireAuth>{content}</RequireAuth>;
}

function LoadingShell() {
  return (
    <section className="mx-auto max-w-lg rounded-kai border border-line bg-white p-5 text-sm font-semibold text-muted shadow-sm">
      Loading Kai.
    </section>
  );
}
