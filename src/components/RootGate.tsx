import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../lib/api";
import { useUserStore } from "../stores/userStore";
import { Landing } from "../pages/Landing";

/**
 * Root ("/") gate for the no-auth (dev-user) experience: a first-time visitor
 * who types the bare domain lands on the onboarding welcome ("/welcome"), while
 * a returning, already-onboarded user sees the Landing page.
 *
 * Only used when Clerk auth is off — when auth is on, new sign-ups are already
 * routed to "/welcome" by Clerk's forceRedirectUrl, and "/" stays the public
 * marketing Landing for signed-out visitors.
 */
export function RootGate() {
  const onboardingCompletedAt = useUserStore((state) => state.onboardingCompletedAt);
  const hydrate = useUserStore((state) => state.hydrate);
  const [decided, setDecided] = useState<"loading" | "new" | "returning">(
    onboardingCompletedAt ? "returning" : "loading",
  );

  useEffect(() => {
    let cancelled = false;
    if (onboardingCompletedAt) {
      setDecided("returning");
      return;
    }
    (async () => {
      try {
        const profile = await api.getUser();
        if (cancelled) return;
        hydrate(profile);
        setDecided(profile.onboardingCompletedAt ? "returning" : "new");
      } catch {
        // No account yet / not reachable → treat as a first-time visitor.
        if (!cancelled) setDecided("new");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onboardingCompletedAt, hydrate]);

  if (decided === "loading") return null;
  if (decided === "new") return <Navigate to="/welcome" replace />;
  return <Landing />;
}
