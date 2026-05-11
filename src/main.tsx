import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import "./styles/globals.css";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const hasRealClerkKey = typeof clerkKey === "string" && clerkKey.startsWith("pk_");

function Providers({ children }: { children: React.ReactNode }) {
  if (!hasRealClerkKey) return <>{children}</>;
  return (
    <ClerkProvider
      publishableKey={clerkKey}
      signInFallbackRedirectUrl="/onboarding"
      signInForceRedirectUrl="/onboarding"
      signUpFallbackRedirectUrl="/onboarding"
      signUpForceRedirectUrl="/onboarding"
    >
      {children}
    </ClerkProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Providers>
      <BrowserRouter>
        <App authEnabled={hasRealClerkKey} />
      </BrowserRouter>
    </Providers>
  </React.StrictMode>
);
