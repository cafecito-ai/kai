import { useEffect } from "react";
import { api } from "../../lib/api";
import { useProgressStore } from "../../stores/progressStore";
import { useUserStore } from "../../stores/userStore";

export function AppDataHydrator() {
  const hydrateUser = useUserStore((state) => state.hydrate);
  const setEvents = useProgressStore((state) => state.setEvents);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const [userResult, progressResult] = await Promise.allSettled([api.getUser(), api.getProgress()]);
      if (cancelled) return;
      if (userResult.status === "fulfilled") hydrateUser(userResult.value);
      if (progressResult.status === "fulfilled") setEvents(progressResult.value.eventsByDay);
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [hydrateUser, setEvents]);

  return null;
}
