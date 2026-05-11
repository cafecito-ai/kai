import { useAuth } from "@clerk/clerk-react";
import { Navigate, useLocation } from "react-router-dom";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return <LoadingAuth />;
  if (!isSignedIn) return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;

  return children;
}

function LoadingAuth() {
  return (
    <section className="mx-auto max-w-lg rounded-kai border border-line bg-white p-5 text-sm font-semibold text-muted shadow-sm">
      Opening Kai...
    </section>
  );
}
