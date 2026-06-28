import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "../../lib/api";
import { isOnboardingV2Enabled } from "../../lib/onboarding/flag";
import { useUserStore } from "../../stores/userStore";
import { RequireAuth } from "./RequireAuth";

export function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const hydrate = useUserStore((state) => state.hydrate);
  const onboardingCompletedAt = useUserStore((state) => state.onboardingCompletedAt);
  const [loading, setLoading] = useState(onboardingCompletedAt === null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkOnboarding() {
      try {
        const profile = await api.getUser();
        if (cancelled) return;
        hydrate(profile);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (onboardingCompletedAt === null) void checkOnboarding();
    else setLoading(false);

    return () => {
      cancelled = true;
    };
  }, [hydrate, onboardingCompletedAt]);

  return (
    <RequireAuth>
      {loading ? <LoadingShell /> : failed || onboardingCompletedAt ? children : <Navigate to={isOnboardingV2Enabled() ? "/onboarding-v2" : "/onboarding"} replace state={{ from: location.pathname }} />}
    </RequireAuth>
  );
}

function LoadingShell() {
  return (
    <section className="mx-auto max-w-lg rounded-kai border border-line bg-white p-5 text-sm font-semibold text-muted shadow-sm">
      Loading Kai.
    </section>
  );
}
