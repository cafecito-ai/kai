// KaiGreeting — the "your best friend is on the home screen" surface.
//
// Lands at the top of /home. Shows the KAI character with a contextual
// line of dialogue tailored to the user (uses their first name, references
// recent sleep / mood / hydration / streak when there's signal). Below
// the line: a single-tap reply chip + a Talk-to-KAI button so they can
// jump straight into chat with minimal friction.
//
// Goal: make the user want to talk to KAI every time they open the app.

import { ArrowUpRight, MessageCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { KaiCharacter } from "./KaiCharacter";
import { pickKaiGreeting } from "../lib/kai-greeting";
import { daysBuilding, getHeroImage, getIdentityStatement } from "../lib/local-identity";
import { getSystemGoal } from "../lib/local-systems";
import { useStorageUserId } from "../lib/storage-user-id";
import { useUserStore } from "../stores/userStore";

export function KaiGreeting() {
  const navigate = useNavigate();
  const displayName = useUserStore((s) => s.displayName);
  const userId = useStorageUserId();

  // Greeting recomputes when display name changes (e.g. after onboarding).
  // We don't pin it to a refresh signal — by design, it's a snapshot at
  // page-load time so the greeting feels intentional, not jittery.
  const greeting = useMemo(() => pickKaiGreeting(displayName), [displayName]);

  // Identity, folded into KAI's bubble: the goal/identity lead the greeting,
  // and the hero photo sits softly behind the character (not a card).
  const [identity, setIdentity] = useState<{
    goal: string | null;
    statement: string | null;
    hero: string | null;
    heroPos: string;
    days: number;
  }>({ goal: null, statement: null, hero: null, heroPos: "50% 50%", days: 1 });
  useEffect(() => {
    const read = () => {
      const h = getHeroImage();
      setIdentity({
        goal: getSystemGoal(userId),
        statement: getIdentityStatement(),
        hero: h?.dataUrl ?? null,
        heroPos: h?.position ?? "50% 50%",
        days: daysBuilding(),
      });
    };
    read();
    window.addEventListener("kai:state-changed", read);
    return () => window.removeEventListener("kai:state-changed", read);
  }, [userId]);

  // KAI waves hello when you open the app, then settles into the normal
  // talking idle after one wave loop (~3.2s).
  const [waving, setWaving] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setWaving(false), 3200);
    return () => clearTimeout(t);
  }, []);

  function openChat(draft?: string) {
    // Pre-fill the chat input with the chosen reply chip so the user
    // can fire off a message in one extra tap.
    navigate("/chat", { state: draft ? { draft } : undefined });
  }

  const hasIdentity = Boolean(identity.goal || identity.statement);

  return (
    <section className="relative">
      {/* Identity hero — the emotional centerpiece. The first thing you see is
          who you're becoming: your photo, your goal, your chosen identity, and
          how long you've been at it. Not "Good morning." */}
      {hasIdentity && (
        <div className="mb-5 overflow-hidden rounded-3xl border border-glass-border shadow-card-lg">
          <div className="relative">
            {identity.hero ? (
              <img
                src={identity.hero}
                alt=""
                style={{ objectPosition: identity.heroPos }}
                className="h-48 w-full object-cover sm:h-56"
              />
            ) : (
              <div className="h-32 w-full bg-gradient-to-br from-accent/30 via-surface to-background" />
            )}
            {/* Scrim so the text is always legible over any photo. */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              {identity.goal && (
                <p className="font-display text-2xl font-bold leading-tight tracking-tight text-text-primary">
                  {identity.goal}
                </p>
              )}
              {identity.statement && (
                <p className="mt-1 text-sm italic leading-snug text-text-secondary">
                  “{identity.statement}”
                </p>
              )}
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                Day {identity.days} becoming the person you said you'd be
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Glow background behind the character */}
      <div
        className="
          pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2
          h-[140%] w-[140%] rounded-full bg-accent/20 blur-3xl
          kai-greeting-halo
        "
        aria-hidden="true"
      />

      <div className="flex flex-col items-center gap-4">
        {/* Character. Smaller than Welcome (which is hero scale) but
            still clearly "a person looking at you." */}
        <div className="kai-greeting-enter">
          <KaiCharacter size={150} face speaking gesture={waving ? "wave" : undefined} />
        </div>

        {/* Dialogue bubble — the contextual greeting line. Tap to chat. */}
        <button
          type="button"
          onClick={() => openChat()}
          className="
            group relative w-full max-w-md rounded-2xl
            border border-glass-border bg-surface
            px-5 py-4 shadow-card
            transition active:scale-[0.99] hover:bg-surface-muted
            focus-ring text-left
          "
        >
          {/* Identity now leads in the hero panel above; the bubble is just
              KAI's warm, contextual line. */}
          <p className="font-display text-lg font-medium leading-snug text-text-primary sm:text-xl">
            {greeting.line}
          </p>
          <span
            className="
              mt-2 inline-flex items-center gap-1
              font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted
            "
          >
            <MessageCircle size={11} aria-hidden="true" />
            tap to talk
          </span>
        </button>

        {/* Single-tap reply chip — sends the chip text straight into
            chat as a draft. Lets the user "answer" KAI with one finger. */}
        <button
          type="button"
          onClick={() => openChat(greeting.replyChip)}
          className="
            inline-flex items-center gap-1.5 rounded-full
            border border-accent-soft bg-accent-soft/40
            px-4 py-2 text-sm font-medium text-accent
            shadow-card transition active:scale-95 hover:bg-accent-soft/60
            focus-ring
          "
        >
          {greeting.replyChip}
          <ArrowUpRight size={14} aria-hidden="true" />
        </button>
      </div>

      <style>{`
        @keyframes kai-greeting-enter {
          0%   { transform: translateY(20px) scale(0.85); opacity: 0; filter: blur(8px); }
          70%  { transform: translateY(-2px) scale(1.02); opacity: 1; filter: blur(0); }
          100% { transform: translateY(0)    scale(1);    opacity: 1; filter: blur(0); }
        }
        .kai-greeting-enter {
          animation: kai-greeting-enter 1100ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes kai-greeting-halo {
          0%, 100% { transform: translate(-50%, -50%) scale(1);    opacity: 0.7; }
          50%      { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
        }
        .kai-greeting-halo {
          animation: kai-greeting-halo 2800ms ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
