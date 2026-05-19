import { SignIn, SignUp } from "@clerk/clerk-react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { AppDataHydrator } from "./components/app/AppDataHydrator";
import { ApiAuthBridge } from "./components/auth/ApiAuthBridge";
import { RequireAuth } from "./components/auth/RequireAuth";
import { RequireOnboarding } from "./components/auth/RequireOnboarding";
import { AppShell } from "./components/layout/AppShell";
import { Chat } from "./pages/Chat";
import { CheckIn } from "./pages/CheckIn";
import { Crisis } from "./pages/Crisis";
import { Journal } from "./pages/Journal";
import { SleepLog } from "./pages/SleepLog";
import { Demo } from "./pages/Demo";
import { DesignPicker } from "./pages/DesignPicker";
import { DesignTokens } from "./pages/DesignTokens";
import { EngineMental } from "./pages/EngineMental";
import { EnginePhysical } from "./pages/EnginePhysical";
import { ForParents } from "./pages/ForParents";
import { Groups } from "./pages/Groups";
import { GuidePage } from "./pages/GuidePage";
import { Home } from "./pages/Home";
import { Landing } from "./pages/Landing";
import { Onboarding } from "./pages/Onboarding";
import { Profile } from "./pages/Profile";
import { Ops } from "./pages/Ops";
import { OpsDemoSession } from "./pages/OpsDemoSession";
import { OpsDemoSessions } from "./pages/OpsDemoSessions";
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
          <Route path="/chat" element={protectedOnboarding(<Chat />)} />
          <Route path="/check-in" element={protectedOnboarding(<CheckIn />)} />
          <Route path="/journal" element={protectedOnboarding(<Journal />)} />
          <Route path="/sleep/log" element={protectedOnboarding(<SleepLog />)} />
          <Route path="/engine/physical" element={protectedOnboarding(<EnginePhysical />)} />
          <Route path="/engine/potential" element={<Navigate to="/engine/mental" replace />} />
          <Route path="/engine/mental" element={protectedOnboarding(<EngineMental />)} />
          <Route path="/engine/:engineId/guides/:slug" element={protectedOnboarding(<GuidePage />)} />
          <Route path="/progress" element={protectedOnboarding(<Progress />)} />
          <Route path="/groups" element={protectedOnboarding(<Groups />)} />
          <Route path="/profile" element={protectedOnboarding(<Profile />)} />
          <Route path="/settings" element={protectedOnboarding(<Settings />)} />
          <Route path="/crisis" element={<Crisis />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/design" element={<DesignPicker />} />
          <Route path="/_design-tokens" element={<DesignTokens />} />
          <Route path="/scope" element={<Scope />} />
          <Route path="/ops" element={protectedAuth(<Ops />)} />
          <Route path="/ops/demo-sessions" element={protectedAuth(<OpsDemoSessions />)} />
          <Route path="/ops/demo-sessions/:sessionId" element={protectedAuth(<OpsDemoSession />)} />
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
