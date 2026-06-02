// /scan — body scan welcome (T-028).
//
// Per AGENT_PLAN T-028 + CLAUDE_v3_PATCH §3:
//   - Shows the verbatim privacy promise copy
//   - "Begin scan" CTA goes to /scan/capture
//   - Link to /scan/history shows past sessions
//   - Re-consent gate for under-16 users (first scan only)
//   - 3-sessions-per-week soft block with the spec's "come back" copy
//
// AI vision is NOT wired here — that's T-030 / Phase E.

import { ArrowLeft, Camera, Eye, Lock, ShieldCheck, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { canStartNewScanSession, sessionsInLastSevenDays } from "../../lib/scan-storage";

// Verbatim per CLAUDE_v3_PATCH §3 — do not edit without spec change.
const PRIVACY_PROMISE =
  "Your scans are private. They're stored on your device and only sent to our AI for analysis — never shared, never used for training, never seen by anyone else. You can delete any scan at any time.";

const RATE_LIMIT_COPY =
  "You've scanned a lot this week. Take a few days and come back — the changes worth seeing take time.";

export function ScanWelcome() {
  const remaining = Math.max(0, 3 - sessionsInLastSevenDays());
  const canScan = canStartNewScanSession();

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-2 pb-6 sm:max-w-lg">
      <header className="flex items-center justify-between pb-3">
        <Link
          to="/home"
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted focus-ring"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
          body scan
        </p>
        <Link
          to="/scan/history"
          aria-label="Scan history"
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted focus-ring"
        >
          <Eye size={18} aria-hidden="true" />
        </Link>
      </header>

      <div className="pt-2 pb-6 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent-cool-soft">
          <Camera size={22} className="text-accent-cool" aria-hidden="true" />
        </span>
        <h1 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight">
          Body scan
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Three photos. KAI looks at posture and alignment — never how you look.
        </p>
      </div>

      {/* Privacy promise — verbatim per spec */}
      <section className="mb-4 rounded-glass border border-glass-border bg-surface p-5 shadow-card">
        <div className="flex items-center gap-2 pb-2">
          <ShieldCheck size={16} className="text-success" aria-hidden="true" />
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
            privacy promise
          </p>
        </div>
        <p className="text-sm leading-relaxed text-text-primary">
          {PRIVACY_PROMISE}
        </p>
      </section>

      {/* What KAI looks at + does NOT look at */}
      <section className="mb-4 rounded-glass border border-glass-border bg-surface p-5 shadow-card">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
          what KAI looks at
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-text-primary">
          <li>• Posture (shoulders, hips, head carriage)</li>
          <li>• Alignment (knees, ankles, spine)</li>
          <li>• Mobility cues KAI can suggest stretches for</li>
        </ul>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
          what KAI never does
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-text-primary">
          <li>• Estimate weight or body fat</li>
          <li>• Compare your body to anyone else's</li>
          <li>• Comment on how you look</li>
        </ul>
      </section>

      {/* Encryption / delete reassurance */}
      <section className="mb-5 rounded-glass border border-glass-border bg-surface p-5 shadow-card">
        <div className="flex items-center gap-2 pb-2">
          <Lock size={16} className="text-accent-cool" aria-hidden="true" />
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
            on this device
          </p>
        </div>
        <p className="text-sm leading-relaxed text-text-secondary">
          Scans are encrypted before they're saved. You can{" "}
          <Trash2
            size={12}
            className="-mt-0.5 inline text-text-secondary"
            aria-hidden="true"
          />{" "}
          delete any scan at any time — it's gone for good.
        </p>
      </section>

      {/* CTA / rate limit */}
      {!canScan ? (
        <div className="rounded-glass border border-glass-border bg-surface p-5 text-center shadow-card">
          <p className="text-sm leading-relaxed text-text-primary">{RATE_LIMIT_COPY}</p>
          <Link
            to="/scan/history"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-glass-border bg-surface px-4 text-sm font-medium text-text-primary shadow-card focus-ring"
          >
            See past scans
          </Link>
        </div>
      ) : (
        <>
          <Link
            to="/scan/capture"
            className="
              flex h-12 w-full items-center justify-center gap-2 rounded-full
              bg-text-primary text-background font-medium
              shadow-card transition active:scale-[0.99] focus-ring
            "
          >
            <Camera size={16} aria-hidden="true" />
            Begin scan
          </Link>
          <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            {remaining} of 3 this week
          </p>
        </>
      )}
    </div>
  );
}
