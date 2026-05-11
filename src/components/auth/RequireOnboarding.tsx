import { RequireAuth } from "./RequireAuth";

export function RequireOnboarding({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
