import { SignIn, SignUp } from "@clerk/clerk-react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ApiAuthBridge } from "./components/auth/ApiAuthBridge";
import { RequireAuth } from "./components/auth/RequireAuth";
import { RequireOnboarding } from "./components/auth/RequireOnboarding";
import { AppShell } from "./components/layout/AppShell";
import { Crisis } from "./pages/Crisis";
import { DesignPicker } from "./pages/DesignPicker";
import { EngineMental } from "./pages/EngineMental";
import { EnginePhysical } from "./pages/EnginePhysical";
import { EnginePotential } from "./pages/EnginePotential";
import { ForParents } from "./pages/ForParents";
import { Home } from "./pages/Home";
import { Landing } from "./pages/Landing";
import { Onboarding } from "./pages/Onboarding";
import { PolicyPage } from "./pages/PolicyPage";
import { Progress } from "./pages/Progress";
import { Settings } from "./pages/Settings";

export default function App() {
  return (
    <ApiAuthBridge>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Landing />} />
          <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/onboarding" />} />
          <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/onboarding" />} />
          <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
          <Route path="/home" element={<RequireOnboarding><Home /></RequireOnboarding>} />
          <Route path="/engine/physical" element={<RequireOnboarding><EnginePhysical /></RequireOnboarding>} />
          <Route path="/engine/potential" element={<RequireOnboarding><EnginePotential /></RequireOnboarding>} />
          <Route path="/engine/mental" element={<RequireOnboarding><EngineMental /></RequireOnboarding>} />
          <Route path="/progress" element={<RequireOnboarding><Progress /></RequireOnboarding>} />
          <Route path="/settings" element={<RequireOnboarding><Settings /></RequireOnboarding>} />
          <Route path="/crisis" element={<Crisis />} />
          <Route path="/design" element={<DesignPicker />} />
          <Route path="/for-parents" element={<ForParents />} />
          <Route path="/terms" element={<PolicyPage kind="terms" />} />
          <Route path="/privacy" element={<PolicyPage kind="privacy" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ApiAuthBridge>
  );
}
