// /settings — KAI personalization + parent consent.
//
// Rebuilt to match the rest of the app's design language (surface +
// glass-border + KaiOrb tints + Fraunces display headings). Previously
// used the v0 AppHero/AppSurface/field primitives which looked stale
// next to the home / progress / scan pages.
//
// Sections:
//   1. KAI identity — kaiName + tone (3-card picker, not a dropdown)
//   2. Parent consent — status, parent email, resend button
//   3. Privacy + danger zone — link to delete-my-data, sign out

import { ArrowLeft, Check, Heart, Mail, Scale, ShieldCheck, Zap } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

import { KaiOrb } from "../components/KaiOrb";
import { api } from "../lib/api";
import type { KaiTone } from "../lib/types";
import { useUserStore } from "../stores/userStore";

const TONES: Array<{
  id: KaiTone;
  label: string;
  description: string;
  icon: LucideIcon;
  tint: string;
}> = [
  {
    id: "warm",
    label: "Warm",
    description: "Empathy first. Patient and emotionally present.",
    icon: Heart,
    tint: "text-accent-warm",
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "Warm AND honest. The default for most people.",
    icon: Scale,
    tint: "text-accent-cool",
  },
  {
    id: "direct",
    label: "Direct",
    description: "No padding. Gets to the point, still caring.",
    icon: Zap,
    tint: "text-accent",
  },
];

export function Settings() {
  const {
    kaiName,
    kaiTone,
    parentEmail,
    consentStatus,
    parentConsentAt,
    setKai,
    setConsentPending,
  } = useUserStore();

  const [name, setName] = useState(kaiName);
  const [tone, setTone] = useState<KaiTone>(kaiTone);
  const [consentEmail, setConsentEmail] = useState(parentEmail ?? "");
  const [saving, setSaving] = useState(false);
  const [sendingConsent, setSendingConsent] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [consentMessage, setConsentMessage] = useState("");

  async function save() {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      await api.updateUser({ kaiName: name, kaiTone: tone });
      setSaved(true);
    } catch {
      setSaved(true);
      setError("Saved on this device. We'll sync to your account next time you're online.");
    } finally {
      setKai(name, tone);
      setSaving(false);
      // Auto-clear the "Saved" pill after a few seconds.
      setTimeout(() => setSaved(false), 3000);
    }
  }

  async function resendConsent() {
    if (!consentEmail.trim()) {
      setConsentMessage("Add a parent email first.");
      return;
    }
    setSendingConsent(true);
    setConsentMessage("");
    try {
      await api.updateUser({ parentEmail: consentEmail.trim() });
      const result = await api.sendParentConsent({
        parentEmail: consentEmail.trim(),
        teenName: name || "Kai user",
      });
      setConsentPending(consentEmail.trim());
      setConsentMessage(
        result.emailSent
          ? "Consent email sent."
          : "Consent link created. Email sender isn't configured here yet.",
      );
    } catch {
      setConsentMessage("Couldn't send right now — try again in a minute.");
    } finally {
      setSendingConsent(false);
    }
  }

  const dirty = name !== kaiName || tone !== kaiTone;

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-2 pb-6 sm:max-w-lg">
      <header className="flex items-center justify-between pb-3">
        <Link
          to="/profile"
          aria-label="Back to profile"
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted focus-ring"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
          settings
        </p>
        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      <div className="pb-6 text-center">
        <KaiOrb size={64} />
        <h1 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight">
          Tune your KAI
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          A name and a voice — change either any time.
        </p>
      </div>

      {/* ─── KAI identity ─────────────────────────────────────────── */}
      <section className="mb-5 rounded-glass border border-glass-border bg-surface p-5 shadow-card">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
          KAI's name
        </p>
        <input
          type="text"
          value={name}
          maxLength={24}
          onChange={(e) => setName(e.target.value)}
          placeholder="KAI"
          className="
            mt-2.5 w-full rounded-lg border border-glass-border bg-surface
            px-4 py-3 text-base text-text-primary
            placeholder:text-text-muted shadow-card focus-ring
          "
        />
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
          You can call them anything that fits — Coach, Buddy, KAI.
        </p>
      </section>

      <section className="mb-5 rounded-glass border border-glass-border bg-surface p-5 shadow-card">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
          how KAI talks
        </p>
        <div className="mt-3 space-y-2">
          {TONES.map((t) => {
            const selected = tone === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTone(t.id)}
                aria-pressed={selected}
                className={`
                  flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left
                  transition active:scale-[0.99]
                  ${
                    selected
                      ? "border-text-primary bg-text-primary text-background shadow-card-lg"
                      : "border-glass-border bg-surface text-text-primary shadow-card hover:bg-surface-muted"
                  }
                `}
              >
                <span
                  className={`
                    flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                    ${selected ? "bg-background/15" : "bg-surface-muted"}
                  `}
                >
                  <t.icon
                    size={16}
                    className={selected ? "text-background" : t.tint}
                    aria-hidden="true"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-tight">
                    {t.label}
                  </span>
                  <span
                    className={`block text-[11px] leading-tight ${
                      selected ? "text-background/70" : "text-text-secondary"
                    }`}
                  >
                    {t.description}
                  </span>
                </span>
                {selected && <Check size={16} className="text-background" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* Save bar */}
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          className="
            flex h-12 flex-1 items-center justify-center rounded-full
            bg-text-primary text-background font-medium
            shadow-card transition active:scale-[0.99]
            disabled:cursor-not-allowed disabled:bg-text-soft
            focus-ring
          "
        >
          {saving ? "Saving…" : dirty ? "Save changes" : "Nothing to save"}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-2 text-xs font-medium text-success">
            <Check size={12} aria-hidden="true" /> Saved
          </span>
        )}
      </div>
      {error && (
        <p className="mb-5 text-center text-xs text-text-secondary">{error}</p>
      )}

      {/* ─── Parent consent ───────────────────────────────────────── */}
      <section className="mb-5 rounded-glass border border-glass-border bg-surface p-5 shadow-card">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-accent-cool" aria-hidden="true" />
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
            parent consent
          </p>
        </div>

        <ConsentStatusPill status={consentStatus} completedAt={parentConsentAt} />

        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          Parent consent confirms beta access for teen accounts. It never exposes
          your private answers, goals, meals, or chats.
        </p>

        <div className="mt-4 space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            parent email
          </p>
          <div className="relative">
            <Mail
              size={14}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
            <input
              type="email"
              value={consentEmail}
              onChange={(e) => setConsentEmail(e.target.value)}
              placeholder="parent@example.com"
              className="
                w-full rounded-lg border border-glass-border bg-surface
                py-3 pl-10 pr-4 text-base text-text-primary
                placeholder:text-text-muted shadow-card focus-ring
              "
            />
          </div>
        </div>

        <button
          type="button"
          onClick={resendConsent}
          disabled={sendingConsent}
          className="
            mt-4 flex h-11 w-full items-center justify-center rounded-full
            border border-glass-border bg-surface text-text-primary font-medium
            shadow-card transition hover:bg-surface-muted active:scale-[0.99]
            disabled:cursor-not-allowed disabled:opacity-50
            focus-ring
          "
        >
          {sendingConsent
            ? "Sending…"
            : consentStatus === "pending"
              ? "Resend consent email"
              : "Send consent email"}
        </button>

        {consentMessage && (
          <p className="mt-2 text-center text-xs text-text-secondary">
            {consentMessage}
          </p>
        )}
      </section>

      {/* ─── Privacy / danger zone ─────────────────────────────────── */}
      <section className="rounded-glass border border-glass-border bg-surface p-5 shadow-card">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
          privacy
        </p>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          Body scans are encrypted on your device. Journals and check-ins are
          private to you. Nobody else — not parents, not Boost AI staff — can
          see what you write or scan.
        </p>
        <div className="mt-4 grid gap-2">
          <Link
            to="/privacy"
            className="
              flex h-11 items-center justify-center rounded-full border border-glass-border
              bg-surface text-sm font-medium text-text-primary shadow-card
              transition hover:bg-surface-muted focus-ring
            "
          >
            Read the full privacy policy
          </Link>
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Pieces
// ─────────────────────────────────────────────────────────────────────

function ConsentStatusPill({
  status,
  completedAt,
}: {
  status: string;
  completedAt: string | null | undefined;
}) {
  if (status === "complete") {
    return (
      <div className="mt-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
          <Check size={12} aria-hidden="true" /> Complete
        </span>
        {completedAt && (
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            {new Date(completedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    );
  }
  if (status === "pending") {
    return (
      <div className="mt-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-3 py-1 text-xs font-medium text-warning">
          Waiting for parent
        </span>
      </div>
    );
  }
  return (
    <div className="mt-3">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-text-secondary">
        Not required yet
      </span>
    </div>
  );
}
