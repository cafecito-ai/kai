import { useEffect } from "react";
import { api } from "../../lib/api";
import { useKaiStore } from "../../stores/kaiStore";
import { useProgressStore } from "../../stores/progressStore";
import { useUserStore } from "../../stores/userStore";

/**
 * Single source-of-truth for the app's first GET /api/user/me +
 * GET /api/progress + GET /api/conversations/current on mount.
 * Consumers (RequireOnboarding, the engines, etc.) should READ
 * from the stores, not fire their own fetches — that's how we
 * shipped a double-fetch race between this component and
 * RequireOnboarding (bug fixed in this PR).
 *
 * Whether the user fetch succeeds or fails, we mark the userStore
 * as `hydrated` so gates can decide what to render. A failure
 * here is treated as "no profile yet"; RequireOnboarding then
 * shows its loading state OR redirects to onboarding, whichever
 * is appropriate.
 */
export function AppDataHydrator() {
  const hydrateUser = useUserStore((state) => state.hydrate);
  const markHydrated = useUserStore((state) => state.markHydrated);
  const setEvents = useProgressStore((state) => state.setEvents);
  const hydrateKai = useKaiStore((state) => state.hydrate);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const [userResult, progressResult, conversationResult] = await Promise.allSettled([
        api.getUser(),
        api.getProgress(),
        api.getCurrentConversation("kai")
      ]);
      if (cancelled) return;
      if (userResult.status === "fulfilled") {
        hydrateUser(userResult.value);
      } else {
        // Mark hydrated even on failure so RequireOnboarding's
        // wait-for-hydrate doesn't stick on a loading shell forever.
        markHydrated();
      }
      if (progressResult.status === "fulfilled") setEvents(progressResult.value.events);
      if (conversationResult.status === "fulfilled") hydrateKai(conversationResult.value);
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [hydrateKai, hydrateUser, markHydrated, setEvents]);

  return null;
}
