// /welcome — kept as a thin redirect.
//
// The cinematic intro that used to live here is now merged into the
// onboarding flow (src/pages/Onboarding.tsx): KAI introduces itself and
// asks the onboarding questions as one continuous experience. This route
// just forwards into that flow so old links / the post-sign-in redirect
// keep working. Already-onboarded users are sent home by Onboarding's own
// guard.

import { Navigate } from "react-router-dom";

export function Welcome() {
  return <Navigate to="/onboarding" replace />;
}
