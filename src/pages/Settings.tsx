// /settings — KAI personalization.
//
// Rebuilt to match the rest of the app's design language (surface +
// glass-border + KaiOrb tints + Fraunces display headings). Previously
// used the v0 AppHero/AppSurface/field primitives which looked stale
// next to the home / progress / scan pages.
//
// Sections:
//   1. KAI identity — kaiName + tone (3-card picker, not a dropdown)
//   2. Privacy — link to policies and data practices

import { ArrowLeft, Check, Heart, Scale, Zap } from "lucide-react";
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
    setKai,
  } = useUserStore();

  const [name, setName] = useState(kaiName);
  const [tone, setTone] = useState<KaiTone>(kaiTone);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

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

      {/* ─── Privacy ───────────────────────────────────────────────── */}
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
