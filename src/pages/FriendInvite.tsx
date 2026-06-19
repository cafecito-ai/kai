// Friend invite — a shareable invite link + QR so a user can bring a friend in.
//
// This is the FRONTEND SHELL only. The real friend graph (accepting an invite,
// the friend list, challenges, status) is backend (Ratner). Until that ships,
// the link is a placeholder built from a stable on-device id, and the screen
// says so honestly ("Friends are coming soon").

import { ArrowLeft, Check, Copy, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";

import { KaiOrb } from "../components/KaiOrb";
import { useStorageUserId } from "../lib/storage-user-id";
import { useUserStore } from "../stores/userStore";

const INVITE_BASE = "https://kai.boostaisearch.ai/join";

export function FriendInvite() {
  const navigate = useNavigate();
  const displayName = useUserStore((s) => s.displayName);
  const userId = useStorageUserId();
  const [copied, setCopied] = useState(false);

  // Placeholder slug until the backend issues real invite codes.
  const slug = useMemo(() => (userId ? userId.slice(0, 10) : "you"), [userId]);
  const link = `${INVITE_BASE}/${slug}`;

  function copy() {
    try {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* no-op */
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-6">
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
          <h1 className="font-display text-2xl font-semibold tracking-tight">Invite a friend</h1>
          <p className="text-sm text-text-secondary">Doing this together makes it stick.</p>
        </div>
      </div>

      {/* KAI + pitch */}
      <div className="mt-8 flex flex-col items-center text-center">
        <KaiOrb size={72} />
        <p className="mt-4 max-w-xs font-display text-lg font-medium leading-snug text-text-primary">
          {displayName ? `Bring someone in, ${displayName}.` : "Bring someone in."}
        </p>
        <p className="mt-1 max-w-xs text-sm text-text-secondary">
          Send them your link. When friends launch, you'll already be connected.
        </p>
      </div>

      {/* QR */}
      <div className="mt-7 flex justify-center">
        <div className="rounded-2xl border border-glass-border bg-white p-4 shadow-card">
          <QRCode value={link} size={168} bgColor="#FFFFFF" fgColor="#0A0A0F" />
        </div>
      </div>

      {/* Link + copy */}
      <div className="mt-6 flex items-center gap-2 rounded-full border border-glass-border bg-surface px-4 py-3 shadow-card">
        <span className="flex-1 truncate font-mono text-sm text-text-secondary">{link}</span>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy invite link"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-text-primary px-3.5 py-2 text-xs font-medium text-background shadow-card transition active:scale-95 focus-ring"
        >
          {copied ? (
            <>
              <Check size={13} aria-hidden="true" /> Copied
            </>
          ) : (
            <>
              <Copy size={13} aria-hidden="true" /> Copy
            </>
          )}
        </button>
      </div>

      {/* Honest shell note */}
      <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-glass-border bg-surface-muted/40 px-4 py-3">
        <UserPlus size={16} className="mt-0.5 shrink-0 text-text-muted" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-text-secondary">
          Friends are coming soon. Save your link now. Once it's live, anyone who joined through it
          shows up here.
        </p>
      </div>
    </div>
  );
}
