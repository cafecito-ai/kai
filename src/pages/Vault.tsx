import { Lock, Play, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  deleteDayZeroVideo,
  getDayZeroVideoUrl,
  readDayZeroMeta,
  type DayZeroMeta,
} from "../lib/day-zero";

const PASSCODE_KEY = "kai_private_vault_passcode_v1";

export function Vault() {
  const [meta, setMeta] = useState<DayZeroMeta | null>(() => readDayZeroMeta());
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const hasPasscode = Boolean(readStoredPasscode());

  useEffect(() => {
    if (!unlocked || !meta) {
      setVideoUrl(null);
      return;
    }
    let currentUrl: string | null = null;
    let cancelled = false;
    getDayZeroVideoUrl(meta.id)
      .then((url) => {
        if (cancelled) {
          if (url) URL.revokeObjectURL(url);
          return;
        }
        currentUrl = url;
        setVideoUrl(url);
      })
      .catch(() => setVideoUrl(null));
    return () => {
      cancelled = true;
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [meta, unlocked]);

  function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const clean = input.trim();
    if (!/^\d{4,8}$/.test(clean)) {
      setError("Use a 4-8 digit passcode.");
      return;
    }

    const stored = readStoredPasscode();
    if (!stored) {
      if (clean !== confirm.trim()) {
        setError("Those passcodes do not match.");
        return;
      }
      localStorage.setItem(PASSCODE_KEY, clean);
      setUnlocked(true);
      return;
    }

    if (stored !== clean) {
      setError("That passcode did not open the Vault.");
      return;
    }
    setUnlocked(true);
  }

  async function removeVideo() {
    await deleteDayZeroVideo();
    setMeta(null);
    setVideoUrl(null);
  }

  return (
    <div className="mx-auto w-full max-w-md max-w-full space-y-5 overflow-x-hidden pt-2 sm:max-w-lg">
      <header className="px-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
          private vault
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight">
          Why I Started
        </h1>
        <p className="mt-2 break-words text-sm leading-relaxed text-text-secondary">
          Your Day 0 reason stays here. Home only points back when you may need it.
        </p>
      </header>

      {!unlocked ? (
        <section className="w-full max-w-full overflow-hidden rounded-glass border border-glass-border bg-surface p-5 shadow-card-lg">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Lock size={17} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold leading-tight">
                {hasPasscode ? "Unlock private space" : "Set a Vault passcode"}
              </h2>
              <p className="mt-1 break-words text-sm leading-relaxed text-text-secondary">
                This is a local privacy gate for this device. It keeps the video out of the open app flow.
              </p>
            </div>
          </div>

          <form className="mt-5 space-y-3" onSubmit={submit}>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                Passcode
              </span>
              <input
                inputMode="numeric"
                autoComplete="off"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                className="mt-1 h-12 w-full min-w-0 rounded-lg border border-glass-border bg-background px-4 font-mono text-lg tracking-[0.25em] text-text-primary focus-ring"
              />
            </label>
            {!hasPasscode && (
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                  Confirm
                </span>
                <input
                  inputMode="numeric"
                  autoComplete="off"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  className="mt-1 h-12 w-full min-w-0 rounded-lg border border-glass-border bg-background px-4 font-mono text-lg tracking-[0.25em] text-text-primary focus-ring"
                />
              </label>
            )}
            {error && <p className="text-sm text-danger">{error}</p>}
            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-text-primary px-5 text-sm font-semibold text-background shadow-card transition active:scale-[0.99] focus-ring"
            >
              {hasPasscode ? "Open Vault" : "Create passcode"}
            </button>
          </form>
        </section>
      ) : (
        <VaultContent meta={meta} videoUrl={videoUrl} onDelete={removeVideo} />
      )}

      <section className="w-full max-w-full overflow-hidden rounded-2xl border border-glass-border bg-surface p-4 shadow-card">
        <div className="flex items-start gap-3">
          <ShieldCheck size={18} className="mt-0.5 text-success" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary">
              Not a homepage card
            </p>
            <p className="mt-1 break-words text-xs leading-relaxed text-text-secondary">
              KAI keeps this out of the daily dashboard so the emotional hit stays rare and meaningful.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function VaultContent({
  meta,
  videoUrl,
  onDelete,
}: {
  meta: DayZeroMeta | null;
  videoUrl: string | null;
  onDelete: () => void;
}) {
  if (!meta) {
    return (
      <section className="rounded-glass border border-glass-border bg-surface p-6 text-center shadow-card-lg">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Sparkles size={22} aria-hidden="true" />
        </span>
        <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight">
          Nothing in the Vault yet
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          Record your Day 0 reason during onboarding or the journey flow. It will live here instead of Home.
        </p>
        <Link
          to="/journey"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-text-primary px-5 text-sm font-semibold text-background shadow-card transition active:scale-[0.99] focus-ring"
        >
          Go to journey
        </Link>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-glass border border-glass-border bg-[#1F1A2E] text-white shadow-card-lg">
      <div className="p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/45">
          why i started
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold leading-tight">
          Day 0
        </h2>
        {meta.quote && (
          <p className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm leading-relaxed text-white/72">
            "{meta.quote}"
          </p>
        )}
      </div>

      <div className="mx-5 overflow-hidden rounded-[28px] bg-black">
        {videoUrl ? (
          <video
            src={videoUrl}
            controls
            playsInline
            className="aspect-[9/12] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[9/12] w-full items-center justify-center text-white/70">
            <Play size={34} aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">
          recorded {relativeDay(meta.createdAt)}
        </p>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 px-3 text-xs font-semibold text-white/72 transition hover:bg-white/10 focus-ring"
        >
          <Trash2 size={13} aria-hidden="true" />
          Delete
        </button>
      </div>
    </section>
  );
}

function readStoredPasscode(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(PASSCODE_KEY);
}

function relativeDay(iso: string): string {
  const timestamp = new Date(iso).getTime();
  const diffDays = Math.max(0, Math.floor((Date.now() - timestamp) / 86400000));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  return `${diffDays} days ago`;
}
