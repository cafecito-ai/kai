import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import { registerCrisisOfflineWorker } from "./lib/register-sw";
import "./styles/globals.css";

registerCrisisOfflineWorker();

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const hasRealClerkKey = typeof clerkKey === "string" && clerkKey.startsWith("pk_");
const authRequired = import.meta.env.VITE_AUTH_REQUIRED === "1";

function Providers({ children }: { children: React.ReactNode }) {
  if (!hasRealClerkKey || !authRequired) return <>{children}</>;
  return <ClerkProvider publishableKey={clerkKey}>{children}</ClerkProvider>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Providers>
      <BrowserRouter>
        <App authEnabled={hasRealClerkKey && authRequired} />
      </BrowserRouter>
    </Providers>
  </React.StrictMode>
);
