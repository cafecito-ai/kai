import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { setApiAuthTokenGetter } from "../../lib/api";

export function ApiAuthBridge({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();
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

  return ready ? <>{children}</> : null;
}
