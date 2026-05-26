import { useAuth, useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { setApiAuthTokenGetter } from "../../lib/api";
import { useUserStore } from "../../stores/userStore";

export function ApiAuthBridge({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const setFirstName = useUserStore((state) => state.setFirstName);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    setApiAuthTokenGetter(() => getToken());
    setReady(true);
    return () => {
      setReady(false);
      setApiAuthTokenGetter(null);
    };
  }, [getToken]);

  // Sync Clerk's first name into userStore so pages can read it
  // without depending on Clerk's hook at render time. This is the
  // only safe place to read `useUser()` directly — ApiAuthBridge
  // only mounts when ClerkProvider is mounted. See the rationale
  // in `src/architecture.test.ts` rule 1.
  useEffect(() => {
    const name = user?.firstName?.trim() || null;
    setFirstName(name);
  }, [user, setFirstName]);

  return ready ? <>{children}</> : null;
}
