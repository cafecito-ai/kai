import { useEffect } from "react";
import { api } from "../../lib/api";
import { useKaiStore } from "../../stores/kaiStore";
import { useProgressStore } from "../../stores/progressStore";
import { useUserStore } from "../../stores/userStore";

export function AppDataHydrator() {
  const hydrateUser = useUserStore((state) => state.hydrate);
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
      if (userResult.status === "fulfilled") hydrateUser(userResult.value);
      if (progressResult.status === "fulfilled") setEvents(progressResult.value.eventsByDay);
      if (conversationResult.status === "fulfilled") hydrateKai(conversationResult.value);
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [hydrateKai, hydrateUser, setEvents]);

  return null;
}
