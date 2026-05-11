import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import "./styles/globals.css";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Keep Clerk optional so the public shell can render before auth is configured.
function Providers({ children }: { children: React.ReactNode }) {
  const hasRealClerkKey = typeof clerkKey === "string" && clerkKey.startsWith("pk_");
  if (!hasRealClerkKey) return <>{children}</>;
  return <ClerkProvider publishableKey={clerkKey}>{children}</ClerkProvider>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Providers>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Providers>
  </React.StrictMode>
);
