import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import "./styles/globals.css";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function MissingClerkKey() {
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4 text-ink">
      <section className="max-w-md rounded-kai border border-ink/10 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-wider text-coral">Auth setup needed</p>
        <h1 className="mt-2 text-2xl font-black">Clerk is not configured.</h1>
        <p className="mt-2 text-sm text-ink/70">Set VITE_CLERK_PUBLISHABLE_KEY before opening Kai.</p>
      </section>
    </main>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  const hasRealClerkKey = typeof clerkKey === "string" && clerkKey.startsWith("pk_");
  if (!hasRealClerkKey) return <MissingClerkKey />;
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
