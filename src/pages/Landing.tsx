import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../lib/api";
import { KaiOrb } from "../components/KaiOrb";
import { useUserStore } from "../stores/userStore";

export function Landing() {
  const hydrate = useUserStore((state) => state.hydrate);
  const onboardingCompletedAt = useUserStore((state) => state.onboardingCompletedAt);
  const [route, setRoute] = useState<"/onboarding" | "/home" | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function routeFirstLoad() {
      try {
        const profile = await api.getUser();
        if (cancelled) return;
        hydrate(profile);
        setRoute(profile.onboardingCompletedAt ? "/home" : "/onboarding");
      } catch {
        if (!cancelled) setRoute("/onboarding");
      }
    }
    void routeFirstLoad();
    return () => {
      cancelled = true;
    };
  }, [hydrate]);

  if (route) return <Navigate to={route} replace />;
  if (onboardingCompletedAt) return <Navigate to="/home" replace />;

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-center text-text-primary">
      <div>
        <KaiOrb size={84} />
        <p className="mt-5 font-display text-2xl font-semibold tracking-tight">
          Opening KAI.
        </p>
      </div>
    </main>
  );
}
