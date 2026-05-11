import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { Crisis } from "./pages/Crisis";
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
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Landing />} />
        <Route path="/sign-in" element={<Navigate to="/onboarding" replace />} />
        <Route path="/sign-up" element={<Navigate to="/onboarding" replace />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/home" element={<Home />} />
        <Route path="/engine/physical" element={<EnginePhysical />} />
        <Route path="/engine/potential" element={<EnginePotential />} />
        <Route path="/engine/mental" element={<EngineMental />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/crisis" element={<Crisis />} />
        <Route path="/for-parents" element={<ForParents />} />
        <Route path="/terms" element={<PolicyPage kind="terms" />} />
        <Route path="/privacy" element={<PolicyPage kind="privacy" />} />
      </Route>
    </Routes>
  );
}
