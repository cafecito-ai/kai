// Comeback — the no-guilt "welcome back" moment shown before the dashboard
// when a user returns after a 7+ day lapse. No streaks, no shame. The point
// is to make returning feel safe. Gated in App.tsx; reachable directly at
// /comeback but it just leads to /home.

import { useNavigate } from "react-router-dom";

import { KaiOrb } from "../components/KaiOrb";

// Set once per app session when the user acknowledges, so navigating around
// in the same session doesn't re-trigger the gate. A genuinely new lapse in a
// future session shows it again.
export const COMEBACK_SEEN_KEY = "kai_comeback_seen";

export function Comeback() {
  const navigate = useNavigate();

  function onContinue() {
    try {
      sessionStorage.setItem(COMEBACK_SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
    navigate("/home", { replace: true });
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <KaiOrb size={84} />

      <h1 className="mt-8 font-display text-3xl font-semibold tracking-tight text-text-primary">
        Welcome back.
      </h1>

      <div className="mt-4 space-y-2 text-lg leading-relaxed text-text-secondary">
        <p>The story isn't over.</p>
        <p>Everyone falls off sometimes.</p>
        <p className="text-text-primary">What matters is what happens next.</p>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="
          mt-10 flex h-14 w-full max-w-xs items-center justify-center rounded-full
          bg-text-primary text-lg font-semibold text-background shadow-card
          transition active:scale-[0.99] focus-ring
        "
      >
        Continue
      </button>
    </div>
  );
}
