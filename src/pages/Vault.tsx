// /vault — the user's sacred/private space.
//
// Locked behind a device biometric (Face ID / Touch ID / fingerprint
// via WebAuthn). First visit prompts the user to register a passkey;
// subsequent visits verify against it.
//
// Right now the inside is a PLACEHOLDER — the Day 0 video / "why I
// started" content isn't recorded yet. The lock shell + auto-resurface
// logic on Home is what matters for v1; the recording flow comes next.

import { ArrowLeft, Fingerprint, Lock, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  hasVaultCredential,
  isVaultUnlocked,
  lockVault,
  registerVaultBiometric,
  verifyVaultBiometric,
} from "../lib/local-vault";
import { useUserStore } from "../stores/userStore";

type State = "checking" | "needs_setup" | "locked" | "unlocked" | "unsupported";

export function Vault() {
  const { kaiName } = useUserStore();
  const [state, setState] = useState<State>("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // WebAuthn requires window.PublicKeyCredential. On unsupported
    // browsers we surface a friendly fallback instead of silently
    // breaking.
    if (
      typeof window === "undefined" ||
      typeof window.PublicKeyCredential === "undefined"
    ) {
      setState("unsupported");
      return;
    }
    if (isVaultUnlocked()) {
      setState("unlocked");
    } else if (hasVaultCredential()) {
      setState("locked");
    } else {
      setState("needs_setup");
    }
  }, []);

  async function handleSetup() {
    setError(null);
    const ok = await registerVaultBiometric("KAI Vault");
    if (ok) setState("unlocked");
    else setError("Couldn't set up the lock — your device may not support biometric, or you cancelled.");
  }

  async function handleUnlock() {
    setError(null);
    const ok = await verifyVaultBiometric();
    if (ok) setState("unlocked");
    else setError("Couldn't verify — try again or use the device passcode.");
  }

  function handleRelock() {
    lockVault();
    setState("locked");
  }

  return (
    <div className="mx-auto flex min-h-[100vh] w-full max-w-md flex-col px-5 pt-3 pb-10 sm:max-w-lg">
      <header className="flex items-center justify-between pb-4">
        <Link
          to="/home"
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted focus-ring"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
          vault · private
        </p>
        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      {state === "checking" && (
        <p className="mt-8 text-center text-sm text-text-secondary">
          Loading…
        </p>
      )}

      {state === "unsupported" && (
        <FallbackCard
          icon={Lock}
          title="Your browser doesn't support the secure lock"
          body="The Vault uses Face ID / Touch ID / fingerprint via a web standard your browser doesn't have. Try opening KAI in a more recent browser, or come back on your phone."
        />
      )}

      {state === "needs_setup" && (
        <SetupCard kaiName={kaiName} onSetup={handleSetup} error={error} />
      )}

      {state === "locked" && (
        <LockedCard onUnlock={handleUnlock} error={error} />
      )}

      {state === "unlocked" && (
        <UnlockedView kaiName={kaiName} onRelock={handleRelock} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────

function SetupCard({
  kaiName,
  onSetup,
  error,
}: {
  kaiName: string;
  onSetup: () => void;
  error: string | null;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Fingerprint size={28} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <h1 className="mt-5 font-display text-3xl font-semibold leading-tight tracking-tight">
        Your private space
      </h1>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-text-secondary">
        The Vault holds the one thing {kaiName} wants you to remember
        when it gets hard — the version of you that started this. Only
        you can open it.
      </p>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-text-secondary">
        Set up your device lock once — Face ID, Touch ID, or fingerprint
        depending on your phone. Stored on this device, never sent
        anywhere.
      </p>
      <button
        type="button"
        onClick={onSetup}
        className="
          mt-6 flex h-12 w-full max-w-xs items-center justify-center gap-2
          rounded-full bg-text-primary text-background font-medium
          shadow-card transition active:scale-[0.99] focus-ring
        "
      >
        <Fingerprint size={16} aria-hidden="true" />
        Set up the lock
      </button>
      {error && (
        <p className="mt-3 max-w-xs text-xs text-warning">{error}</p>
      )}
    </div>
  );
}

function LockedCard({
  onUnlock,
  error,
}: {
  onUnlock: () => void;
  error: string | null;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted text-text-primary">
        <Lock size={26} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <h1 className="mt-5 font-display text-3xl font-semibold leading-tight tracking-tight">
        Locked
      </h1>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-text-secondary">
        Tap to unlock with your device biometric.
      </p>
      <button
        type="button"
        onClick={onUnlock}
        className="
          mt-6 flex h-12 w-full max-w-xs items-center justify-center gap-2
          rounded-full bg-text-primary text-background font-medium
          shadow-card transition active:scale-[0.99] focus-ring
        "
      >
        <Fingerprint size={16} aria-hidden="true" />
        Unlock
      </button>
      {error && (
        <p className="mt-3 max-w-xs text-xs text-warning">{error}</p>
      )}
    </div>
  );
}

function UnlockedView({
  kaiName,
  onRelock,
}: {
  kaiName: string;
  onRelock: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <section className="rounded-glass border border-glass-border bg-surface p-6 shadow-card">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
          why you started
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold leading-tight tracking-tight">
          A space for the version of you that's here now
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          On Day 0, {kaiName} will guide you through a short reflection
          — what you want to be different, who you want to be, what
          you'd tell yourself on a hard day. That recording lives here.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          {kaiName} surfaces this space gently when you might need it —
          when a streak breaks, when you've been quiet, when something
          dips. Not as a guilt-trip — as a door, if you want to walk
          back in.
        </p>
        <div className="mt-5 rounded-lg border border-dashed border-glass-border bg-surface-muted/40 p-5 text-center">
          <Sparkles size={20} className="mx-auto text-accent" aria-hidden="true" />
          <p className="mt-2 text-sm text-text-secondary">
            Your Day 0 recording will live here once you finish it.
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            coming soon
          </p>
        </div>
      </section>
      <button
        type="button"
        onClick={onRelock}
        className="
          mt-4 inline-flex h-10 items-center justify-center gap-1.5
          rounded-full border border-glass-border bg-surface
          px-4 text-xs font-medium text-text-secondary
          shadow-card transition hover:bg-surface-muted focus-ring
        "
      >
        <Lock size={12} aria-hidden="true" />
        Lock vault
      </button>
    </div>
  );
}

function FallbackCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Lock;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted">
        <Icon size={26} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <h1 className="mt-5 font-display text-2xl font-semibold leading-tight tracking-tight">
        {title}
      </h1>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-text-secondary">
        {body}
      </p>
    </div>
  );
}
