import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { setApiAuthTokenGetter } from "../../lib/api";

export function ApiAuthBridge({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  useEffect(() => {
    setApiAuthTokenGetter(() => getToken());
    return () => setApiAuthTokenGetter(null);
  }, [getToken]);

  return <>{children}</>;
}
