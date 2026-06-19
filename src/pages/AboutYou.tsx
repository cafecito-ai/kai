// About you — edit the answers you gave KAI during onboarding (your name,
// goal, your "why") and your future photo. Everything here writes back to the
// same device-local stores onboarding used, so the Home screen updates the
// moment you save. The future photo lives here: see it full-size, replace it,
// or remove it. (How KAI talks lives in Settings, not here.)
//
// Replaces the old "Strengths discovery" entry in Profile.

import { ArrowLeft, Check, ImagePlus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../lib/api";
import {
  clearHeroImage,
  getHeroImage,
  getIdentityStatement,
  setHeroImage,
  setHeroPosition,
  setIdentityStatement,
  type HeroImage,
} from "../lib/local-identity";
import { setNorthStar } from "../lib/local-northstar";
import { getSystemGoal, setSystemGoal } from "../lib/local-systems";
import { useStorageUserId } from "../lib/storage-user-id";
import { useUserStore } from "../stores/userStore";

export function AboutYou() {
  const navigate = useNavigate();
  const { displayName, setDisplayName } = useUserStore();
  const userId = useStorageUserId();

  const [name, setName] = useState(displayName ?? "");
  const [goal, setGoal] = useState("");
  const [why, setWhy] = useState("");
  const [hero, setHero] = useState<HeroImage | null>(null);
  const [saved, setSaved] = useState(false);

  // Photo pick + reframe flow (cropping happens when you add/replace).
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [pending, setPending] = useState<File | null>(null);
  const [pendPos, setPendPos] = useState(50);
  const [pendUrl, setPendUrl] = useState<string | null>(null);

  useEffect(() => {
    setGoal(getSystemGoal(userId) ?? "");
    setWhy(getIdentityStatement() ?? "");
    setHero(getHeroImage());
  }, [userId]);

  useEffect(() => {
    if (!pending) {
      setPendUrl(null);
      return;
    }
    const url = URL.createObjectURL(pending);
    setPendUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pending]);

  function markDirty() {
    if (saved) setSaved(false);
  }

  async function save() {
    const nm = name.trim();
    setDisplayName(nm || null);
    const g = goal.trim();
    if (g) {
      // Both setters dispatch kai:state-changed on their own, so no extra
      // dispatch is needed here (it would only fire redundant re-reads).
      setSystemGoal(g, userId);
      setNorthStar(g, "custom");
    }
    if (why.trim()) setIdentityStatement(why); // dispatches on its own
    setSaved(true);
    try {
      await api.updateUser({ displayName: nm || undefined });
    } catch {
      /* best-effort; local state already reflects the change */
    }
  }

  function pickFile() {
    fileRef.current?.click();
  }

  async function useChosenPhoto() {
    if (!pending) return;
    // Only apply the chosen framing if the image actually stored — setHeroImage
    // returns false on a decode failure or localStorage quota, and
    // setHeroPosition is a no-op without a stored photo.
    const stored = await setHeroImage(pending);
    if (stored) setHeroPosition(`50% ${pendPos}%`);
    setHero(getHeroImage());
    setPending(null);
  }

  function onRemovePhoto() {
    clearHeroImage();
    setHero(null);
  }

  return (
    <div className="mx-auto max-w-md px-5 py-6 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-glass-border bg-surface text-text-secondary transition hover:bg-surface-muted focus-ring"
        >
          <ArrowLeft size={16} aria-hidden="true" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">About you</h1>
          <p className="text-sm text-text-secondary">
            Edit what you told KAI. Saving updates your home screen.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {/* Name */}
        <Field label="What KAI calls you">
          <input
            type="text"
            value={name}
            maxLength={30}
            onChange={(e) => {
              setName(e.target.value);
              markDirty();
            }}
            placeholder="First name"
            className="w-full rounded-full border border-glass-border bg-surface px-4 py-3 text-base text-text-primary placeholder:text-text-muted shadow-card focus-ring"
          />
        </Field>

        {/* Goal */}
        <Field label="What you're working toward">
          <input
            type="text"
            value={goal}
            maxLength={80}
            onChange={(e) => {
              setGoal(e.target.value);
              markDirty();
            }}
            placeholder="e.g. Make the team. Get stronger."
            className="w-full rounded-full border border-glass-border bg-surface px-4 py-3 text-base text-text-primary placeholder:text-text-muted shadow-card focus-ring"
          />
        </Field>

        {/* Why */}
        <Field label="Why it matters to you">
          <textarea
            value={why}
            maxLength={140}
            rows={3}
            onChange={(e) => {
              setWhy(e.target.value);
              markDirty();
            }}
            placeholder="The person you want to be, why you're here."
            className="w-full resize-none rounded-2xl border border-glass-border bg-surface px-4 py-3 text-base text-text-primary placeholder:text-text-muted shadow-card focus-ring"
          />
        </Field>

        {/* Future photo */}
        <Field label="Your future photo">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setPending(f);
                setPendPos(50);
              }
              e.target.value = "";
            }}
          />

          {pending && pendUrl ? (
            // Reframe the chosen photo before saving it.
            <div className="space-y-3">
              <div className="overflow-hidden rounded-2xl border border-glass-border shadow-card">
                <img
                  src={pendUrl}
                  alt="Your future"
                  style={{ objectPosition: `50% ${pendPos}%` }}
                  className="aspect-square w-full object-cover"
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                    Reframe
                  </span>
                  <span className="font-mono text-[10px] text-text-muted">top · bottom</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={pendPos}
                  onChange={(e) => setPendPos(Number(e.target.value))}
                  className="w-full accent-accent"
                  aria-label="Reframe photo vertically"
                />
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPending(null)}
                  className="text-sm font-medium text-text-muted underline-offset-4 hover:underline"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void useChosenPhoto()}
                  className="inline-flex items-center gap-2 rounded-full bg-text-primary px-5 py-2.5 text-sm font-medium text-background shadow-card transition active:scale-[0.98] focus-ring"
                >
                  Use this photo
                </button>
              </div>
            </div>
          ) : hero ? (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-2xl border border-glass-border shadow-card">
                <img
                  src={hero.dataUrl}
                  alt="Your future"
                  style={{ objectPosition: hero.position ?? "50% 50%" }}
                  className="aspect-square w-full object-cover"
                />
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={pickFile}
                  className="text-sm font-medium text-text-secondary underline-offset-4 hover:underline"
                >
                  Replace photo
                </button>
                <button
                  type="button"
                  onClick={onRemovePhoto}
                  className="inline-flex items-center gap-1 text-sm font-medium text-danger underline-offset-4 hover:underline"
                >
                  <Trash2 size={14} aria-hidden="true" />
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={pickFile}
              className="flex aspect-square w-full items-center justify-center rounded-2xl border border-dashed border-glass-border bg-surface text-center shadow-card transition hover:bg-surface-muted focus-ring"
            >
              <span className="flex flex-col items-center gap-2 text-text-secondary">
                <ImagePlus size={26} aria-hidden="true" />
                <span className="text-sm font-medium text-text-primary">Add a photo</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                  where you're headed
                </span>
              </span>
            </button>
          )}
        </Field>
      </div>

      {/* Sticky Save */}
      <div
        className="fixed inset-x-0 bottom-0 border-t border-glass-border bg-background/95 px-5 pt-3 backdrop-blur"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto max-w-md">
          <button
            type="button"
            onClick={() => void save()}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-text-primary font-medium text-background shadow-card transition active:scale-[0.99] focus-ring"
          >
            {saved ? (
              <>
                <Check size={18} aria-hidden="true" />
                Saved
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">{label}</p>
      {children}
    </div>
  );
}
