import { useUser } from "@clerk/clerk-react";

function readDevUserId(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem("kai.devUser");
}

export function useStorageUserId(): string | null {
  const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  const hasRealClerkKey = typeof clerkKey === "string" && clerkKey.startsWith("pk_");
  const authRequired = import.meta.env.VITE_AUTH_REQUIRED === "1";

  if (!hasRealClerkKey || !authRequired) return readDevUserId();

  const { user } = useUser();
  return user?.id ?? null;
}
