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
import { EnergyCheckIn } from "./pages/EnergyCheckIn";
import { Mobility } from "./pages/Mobility";
import { MobilityPlayer } from "./pages/MobilityPlayer";
import { ScanCapture } from "./pages/scan/ScanCapture";
import { ScanHistory } from "./pages/scan/ScanHistory";
import { ScanResult } from "./pages/scan/ScanResult";
import { ScanWelcome } from "./pages/scan/ScanWelcome";
import { Voice } from "./pages/Voice";
import { FoodLog } from "./pages/FoodLog";
import { FoodHistory } from "./pages/FoodHistory";
import { GroupDetail } from "./pages/GroupDetail";
import { GroupInbox } from "./pages/GroupInbox";
import { GroupLeaderboard } from "./pages/GroupLeaderboard";
import { Badges } from "./pages/Badges";
import { Challenges } from "./pages/Challenges";
import { Strengths } from "./pages/Strengths";
import { Welcome } from "./pages/Welcome";
import { SleepLog } from "./pages/SleepLog";
import { WorkoutLog } from "./pages/WorkoutLog";
import { ClientReview } from "./pages/ClientReview";
import { MeetingDeck } from "./pages/MeetingDeck";
import { Demo } from "./pages/Demo";
import { DesignPicker } from "./pages/DesignPicker";
import { DesignTokens } from "./pages/DesignTokens";
// (Old EngineMental + EnginePhysical pages removed — those routes now
// redirect to /home. v2 superseded the three-engine model with the
// two-agent Mind+Body architecture.)
import { ForParents } from "./pages/ForParents";
import { Goals } from "./pages/Goals";
import { Groups } from "./pages/Groups";
import { Schedule } from "./pages/Schedule";
import { GuidePage } from "./pages/GuidePage";
import { Home } from "./pages/Home";
import { Landing } from "./pages/Landing";
import { Onboarding } from "./pages/Onboarding";
import { PreviewFlower } from "./pages/PreviewFlower";
import { Vault } from "./pages/Vault";
import { AboutYou } from "./pages/AboutYou";
import { Comeback, COMEBACK_SEEN_KEY } from "./pages/Comeback";
import { FriendInvite } from "./pages/FriendInvite";
import { daysSinceAnyActivity } from "./lib/local-score";
import { Profile } from "./pages/Profile";
import { Ops } from "./pages/Ops";
import { OpsDemoSession } from "./pages/OpsDemoSession";
import { OpsDemoSessions } from "./pages/OpsDemoSessions";
import { PolicyPage } from "./pages/PolicyPage";
import { Progress } from "./pages/Progress";
import { Scope } from "./pages/Scope";
import { Settings } from "./pages/Settings";

// Before the dashboard, a returning user who's been gone 7+ days sees the
// no-guilt comeback screen — once per app session, and never a brand-new user
// (daysSinceAnyActivity returns null when nothing's ever been logged).
function HomeOrComeback() {
  let seen = false;
  try {
    seen = sessionStorage.getItem(COMEBACK_SEEN_KEY) === "1";
  } catch {
    /* ignore */
  }
  const gap = daysSinceAnyActivity();
  if (!seen && gap !== null && gap >= 7) {
    return <Navigate to="/comeback" replace />;
  }
  return <Home />;
}

export default function App({ authEnabled = true }: { authEnabled?: boolean }) {
  const protectedAuth = (children: React.ReactNode) => (authEnabled ? <RequireAuth>{children}</RequireAuth> : children);
  const protectedOnboarding = (children: React.ReactNode) => (authEnabled ? <RequireOnboarding>{children}</RequireOnboarding> : children);

  const routes = (
      <Routes>
        <Route element={<AppShell />}>
          {/* In dev-user (no-auth) mode the homepage IS the welcome entry —
              Welcome itself bounces already-onboarded users to /home. When real
              Clerk auth is on, "/" stays the public marketing Landing. */}
          <Route path="/" element={authEnabled ? <Landing /> : <Welcome />} />
          <Route
            path="/sign-in/*"
            element={
              authEnabled ? (
                <SignIn
                  routing="path"
                  path="/sign-in"
                  signUpUrl="/sign-up"
                  fallbackRedirectUrl="/welcome"
                  forceRedirectUrl="/welcome"
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
                  fallbackRedirectUrl="/welcome"
                  forceRedirectUrl="/welcome"
                />
              ) : (
                <AuthUnavailable />
              )
            }
          />
          <Route path="/onboarding" element={protectedAuth(<Onboarding />)} />
          <Route path="/welcome" element={protectedOnboarding(<Welcome />)} />
          <Route path="/home" element={protectedOnboarding(<HomeOrComeback />)} />
          <Route path="/comeback" element={protectedOnboarding(<Comeback />)} />
          <Route path="/chat" element={protectedOnboarding(<Chat />)} />
          <Route path="/check-in" element={protectedOnboarding(<CheckIn />)} />
          <Route path="/journal" element={protectedOnboarding(<Journal />)} />
          <Route path="/sleep" element={<Navigate to="/sleep/log" replace />} />
          <Route path="/sleep/log" element={protectedOnboarding(<SleepLog />)} />
          <Route path="/workout" element={<Navigate to="/workout/log" replace />} />
          <Route path="/workout/log" element={protectedOnboarding(<WorkoutLog />)} />
          <Route path="/food" element={<Navigate to="/food/log" replace />} />
          <Route path="/food/log" element={protectedOnboarding(<FoodLog />)} />
          <Route path="/food/history" element={protectedOnboarding(<FoodHistory />)} />
          <Route path="/mobility" element={protectedOnboarding(<Mobility />)} />
          <Route path="/mobility/:id" element={protectedOnboarding(<MobilityPlayer />)} />
          <Route path="/energy" element={protectedOnboarding(<EnergyCheckIn />)} />
          <Route path="/scan" element={protectedOnboarding(<ScanWelcome />)} />
          <Route path="/scan/capture" element={protectedOnboarding(<ScanCapture />)} />
          <Route path="/scan/history" element={protectedOnboarding(<ScanHistory />)} />
          <Route path="/scan/result/:sessionId" element={protectedOnboarding(<ScanResult />)} />
          <Route path="/voice" element={protectedOnboarding(<Voice />)} />
          <Route path="/strengths" element={protectedOnboarding(<Strengths />)} />
          <Route path="/badges" element={protectedOnboarding(<Badges />)} />
          <Route path="/challenges" element={protectedOnboarding(<Challenges />)} />
          <Route path="/goals" element={protectedOnboarding(<Goals />)} />
          {/* Old v0 three-engine routes — kept ONLY as redirects so any
              bookmarked links or stale onboarding state lands on the new
              /home instead of a confusing old page. */}
          <Route path="/engine/physical" element={<Navigate to="/home" replace />} />
          <Route path="/engine/mental" element={<Navigate to="/home" replace />} />
          <Route path="/engine/potential" element={<Navigate to="/home" replace />} />
          {/* Guides (educational content) still useful — keep the route. */}
          <Route path="/engine/:engineId/guides/:slug" element={protectedOnboarding(<GuidePage />)} />
          <Route path="/progress" element={protectedOnboarding(<Progress />)} />
          <Route path="/groups" element={protectedOnboarding(<Groups />)} />
          <Route path="/schedule" element={protectedOnboarding(<Schedule />)} />
          <Route path="/groups/inbox" element={protectedOnboarding(<GroupInbox />)} />
          <Route path="/groups/:id" element={protectedOnboarding(<GroupDetail />)} />
          <Route path="/groups/:id/leaderboard" element={protectedOnboarding(<GroupLeaderboard />)} />
          <Route path="/profile" element={protectedOnboarding(<Profile />)} />
          <Route path="/about-you" element={protectedOnboarding(<AboutYou />)} />
          <Route path="/invite" element={protectedOnboarding(<FriendInvite />)} />
          {/* Vault — private/sacred space behind a biometric lock.
              Not in the tabbar. Surfaces from Home only when fading
              signals fire (low activity / streak break / low mood). */}
          <Route path="/vault" element={protectedOnboarding(<Vault />)} />
          <Route path="/settings" element={protectedOnboarding(<Settings />)} />
          <Route path="/crisis" element={<Crisis />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/client-review" element={<ClientReview />} />
          <Route path="/meeting-deck" element={<MeetingDeck />} />
          <Route path="/monday-deck" element={<Navigate to="/meeting-deck" replace />} />
          <Route path="/walkthrough" element={<Navigate to="/client-review" replace />} />
          {/* Visual preview of FlowerProgressBar at every stage — not in nav */}
          <Route path="/preview/flower" element={<PreviewFlower />} />
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
