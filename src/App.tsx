import { SignIn, SignUp } from "@clerk/clerk-react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { AppDataHydrator } from "./components/app/AppDataHydrator";
import { ApiAuthBridge } from "./components/auth/ApiAuthBridge";
import { RequireAuth } from "./components/auth/RequireAuth";
import { RequireOnboarding } from "./components/auth/RequireOnboarding";
import { AppShell } from "./components/layout/AppShell";
import { Crisis } from "./pages/Crisis";
import { Demo } from "./pages/Demo";
import { DesignPicker } from "./pages/DesignPicker";
import { EngineMental } from "./pages/EngineMental";
import { EnginePhysical } from "./pages/EnginePhysical";
import { EnginePotential } from "./pages/EnginePotential";
import { ForParents } from "./pages/ForParents";
import { GuidePage } from "./pages/GuidePage";
import { Home } from "./pages/Home";
import { Landing } from "./pages/Landing";
import { Onboarding } from "./pages/Onboarding";
import { Ops } from "./pages/Ops";
import { PolicyPage } from "./pages/PolicyPage";
import { Progress } from "./pages/Progress";
import { Scope } from "./pages/Scope";
import { Settings } from "./pages/Settings";

export default function App({ authEnabled = true }: { authEnabled?: boolean }) {
  const protectedAuth = (children: React.ReactNode) => (authEnabled ? <RequireAuth>{children}</RequireAuth> : children);
  const protectedOnboarding = (children: React.ReactNode) => (authEnabled ? <RequireOnboarding>{children}</RequireOnboarding> : children);

  const routes = (
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Landing />} />
          <Route
            path="/sign-in/*"
            element={
              authEnabled ? (
                <SignIn
                  routing="path"
                  path="/sign-in"
                  signUpUrl="/sign-up"
                  fallbackRedirectUrl="/onboarding"
                  forceRedirectUrl="/onboarding"
                />
              ) : (
                <AuthUnavailable />
              )
            }
          />
          <Route
            path="/sign-up/*"
            element={
              authEnabled ? (
                <SignUp
                  routing="path"
                  path="/sign-up"
                  signInUrl="/sign-in"
                  fallbackRedirectUrl="/onboarding"
                  forceRedirectUrl="/onboarding"
                />
              ) : (
                <AuthUnavailable />
              )
            }
          />
          <Route path="/onboarding" element={protectedAuth(<Onboarding />)} />
          <Route path="/home" element={protectedOnboarding(<Home />)} />
          <Route path="/engine/physical" element={protectedOnboarding(<EnginePhysical />)} />
          <Route path="/engine/potential" element={protectedOnboarding(<EnginePotential />)} />
          <Route path="/engine/mental" element={protectedOnboarding(<EngineMental />)} />
          <Route path="/engine/:engineId/guides/:slug" element={protectedOnboarding(<GuidePage />)} />
          <Route path="/progress" element={protectedOnboarding(<Progress />)} />
          <Route path="/settings" element={protectedOnboarding(<Settings />)} />
          <Route path="/crisis" element={<Crisis />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/design" element={<DesignPicker />} />
          <Route path="/scope" element={<Scope />} />
          <Route path="/ops" element={protectedAuth(<Ops />)} />
          <Route path="/for-parents" element={<ForParents />} />
          <Route path="/terms" element={<PolicyPage kind="terms" />} />
          <Route path="/privacy" element={<PolicyPage kind="privacy" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
  );

  if (!authEnabled) {
    return (
      <>
        <AppDataHydrator />
        {routes}
      </>
    );
  }

  return (
    <ApiAuthBridge>
      <AppDataHydrator />
      {routes}
    </ApiAuthBridge>
  );
}

function AuthUnavailable() {
  return (
    <section className="mx-auto max-w-lg rounded-kai border border-ink/10 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-coral">Auth setup needed</p>
      <h1 className="mt-2 text-2xl font-black">Kai sign-in is not configured yet.</h1>
      <p className="mt-2 text-sm leading-6 text-ink/70">Set the Clerk publishable key to open the app shell. Public pages are still available.</p>
      <Link to="/" className="mt-4 inline-flex text-sm font-black text-sky">Back to homepage</Link>
    </section>
  );
}
