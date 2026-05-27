// /groups/:id — one group: members + buckets + encouragement
// (T-037, T-038, T-039, T-040).
//
// Renders:
//   - Group header with the invite code (copy button) + expiry
//   - "Hide my score from this group" toggle
//   - Member list with COARSE bucket pills only
//   - Encouragement button next to each other member
//   - Leaderboard section (opt-in)
//   - Settings actions (block / leave / report)

import {
  ArrowLeft,
  Check,
  Copy,
  DoorOpen,
  EyeOff,
  Flag,
  MessageCircleHeart,
  Trophy,
  UserX,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { GroupActivityFeed } from "../components/GroupActivityFeed";
import { api } from "../lib/api";

type Bucket = "high" | "mid" | "low" | "hidden" | "none";

type Member = {
  userId: string;
  displayName: string;
  bucket: Bucket;
  isMe: boolean;
  leaderboardOptIn: boolean;
};

type GroupDetailState = {
  group: {
    id: string;
    name: string;
    inviteCode: string;
    inviteExpires: string;
    inviteExpired: boolean;
    createdByMe: boolean;
  };
  me: { hideScore: boolean; leaderboardOptIn: boolean };
  members: Member[];
};

export function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<GroupDetailState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [encourageFor, setEncourageFor] = useState<Member | null>(null);
  const [reportFor, setReportFor] = useState<Member | "group" | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const reload = useCallback(async () => {
    if (!id) return;
    try {
      const r = await api.getGroup(id);
      setState(r);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Couldn't load group.");
    }
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (error) {
    return (
      <SimpleScreen>
        <p className="text-sm text-text-secondary">{error}</p>
        <Link
          to="/groups"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-glass-border bg-surface px-4 text-sm font-medium text-text-primary shadow-card focus-ring"
        >
          Back to groups
        </Link>
      </SimpleScreen>
    );
  }
  if (!state) {
    return (
      <SimpleScreen>
        <p className="text-sm text-text-secondary">Loading…</p>
      </SimpleScreen>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-2 pb-6 sm:max-w-lg">
      <header className="flex items-center justify-between pb-3">
        <Link
          to="/groups"
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted focus-ring"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <p className="truncate font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
          {state.group.name}
        </p>
        <Link
          to={`/groups/${state.group.id}/leaderboard`}
          aria-label="Leaderboard"
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted focus-ring"
        >
          <Trophy size={16} aria-hidden="true" />
        </Link>
      </header>

      {/* Invite card */}
      <InviteCard
        code={state.group.inviteCode}
        expires={state.group.inviteExpires}
        expired={state.group.inviteExpired}
      />

      {/* My privacy toggles */}
      <MyToggles
        hideScore={state.me.hideScore}
        leaderboardOptIn={state.me.leaderboardOptIn}
        onChange={async (patch) => {
          await api.updateGroupMembership(state.group.id, patch);
          reload();
        }}
      />

      {/* Rawz/7 — group activity feed (achievements + reactions) */}
      <GroupActivityFeed groupId={state.group.id} />

      {/* Members */}
      <section className="mt-5">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
          members ({state.members.length})
        </p>
        <div className="space-y-2">
          {state.members.map((m) => (
            <MemberRow
              key={m.userId}
              member={m}
              onEncourage={() => setEncourageFor(m)}
              onReport={() => setReportFor(m)}
            />
          ))}
        </div>
      </section>

      {/* Footer actions */}
      <section className="mt-6 space-y-2">
        <button
          type="button"
          onClick={() => setReportFor("group")}
          className="
            flex h-11 w-full items-center justify-center gap-1.5 rounded-full
            border border-glass-border bg-surface text-sm font-medium text-text-secondary
            shadow-card transition hover:bg-surface-muted focus-ring
          "
        >
          <Flag size={12} aria-hidden="true" /> Report this group
        </button>
        <button
          type="button"
          onClick={() => setConfirmLeave(true)}
          className="
            flex h-11 w-full items-center justify-center gap-1.5 rounded-full
            border border-warning-soft bg-warning-soft text-sm font-medium text-warning
            shadow-card transition active:scale-[0.99] focus-ring
          "
        >
          <DoorOpen size={12} aria-hidden="true" /> Leave group
        </button>
      </section>

      {/* Modals */}
      {encourageFor && (
        <EncourageSheet
          groupId={state.group.id}
          recipient={encourageFor}
          onClose={() => setEncourageFor(null)}
        />
      )}
      {reportFor && (
        <ReportSheet
          groupId={state.group.id}
          target={reportFor}
          onClose={() => setReportFor(null)}
        />
      )}
      {confirmLeave && (
        <ConfirmLeaveSheet
          groupId={state.group.id}
          onCancel={() => setConfirmLeave(false)}
          onConfirmed={() => navigate("/groups")}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Pieces
// ─────────────────────────────────────────────────────────────────────

function InviteCard({
  code,
  expires,
  expired,
}: {
  code: string;
  expires: string;
  expired: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const expiryLabel = useMemo(() => {
    const ms = new Date(expires).getTime() - Date.now();
    if (ms <= 0) return "expired";
    const hours = Math.floor(ms / 1000 / 60 / 60);
    if (hours >= 1) return `${hours}h left`;
    const mins = Math.floor(ms / 1000 / 60);
    return `${mins}m left`;
  }, [expires]);

  function copy() {
    try {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* no-op */
    }
  }

  return (
    <section className="mb-4 rounded-glass border border-glass-border bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            invite code
          </p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-[0.18em] text-text-primary">
            {code}
          </p>
        </div>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy invite code"
          className="
            inline-flex items-center gap-1.5 rounded-full border border-glass-border
            bg-surface px-3 py-2 text-xs font-medium text-text-primary
            shadow-card transition active:scale-95 focus-ring
          "
        >
          {copied ? (
            <>
              <Check size={12} aria-hidden="true" /> Copied
            </>
          ) : (
            <>
              <Copy size={12} aria-hidden="true" /> Copy
            </>
          )}
        </button>
      </div>
      <p className={`mt-2 font-mono text-[10px] uppercase tracking-[0.14em] ${expired ? "text-warning" : "text-text-muted"}`}>
        {expired ? "expired — ask the creator for a new code" : `${expiryLabel} · expires in 48h from creation`}
      </p>
    </section>
  );
}

function MyToggles({
  hideScore,
  leaderboardOptIn,
  onChange,
}: {
  hideScore: boolean;
  leaderboardOptIn: boolean;
  onChange: (
    patch: { hideScore?: boolean; leaderboardOptIn?: boolean },
  ) => Promise<void>;
}) {
  return (
    <section className="space-y-2">
      <ToggleRow
        icon={<EyeOff size={14} className="text-text-secondary" />}
        label="Hide my score from this group"
        on={hideScore}
        onChange={(v) => onChange({ hideScore: v })}
      />
      <ToggleRow
        icon={<Trophy size={14} className="text-text-secondary" />}
        label="Show me on the weekly leaderboard"
        on={leaderboardOptIn}
        onChange={(v) => onChange({ leaderboardOptIn: v })}
      />
    </section>
  );
}

function ToggleRow({
  icon,
  label,
  on,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  on: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-pressed={on}
      className="
        flex w-full items-center justify-between gap-3 rounded-lg border border-glass-border
        bg-surface px-4 py-3 text-left shadow-card transition active:scale-[0.99] focus-ring
        hover:bg-surface-muted
      "
    >
      <span className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-text-primary">{label}</span>
      </span>
      <span
        className={`
          flex h-6 w-10 items-center rounded-full transition
          ${on ? "bg-accent justify-end" : "bg-surface-muted justify-start"}
        `}
        aria-hidden="true"
      >
        <span className="mx-0.5 h-5 w-5 rounded-full bg-background shadow" />
      </span>
    </button>
  );
}

function MemberRow({
  member,
  onEncourage,
  onReport,
}: {
  member: Member;
  onEncourage: () => void;
  onReport: () => void;
}) {
  const tint = bucketTint(member.bucket);
  return (
    <div className="flex items-center gap-3 rounded-lg border border-glass-border bg-surface px-4 py-3 shadow-card">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-cool-soft font-mono text-sm font-medium text-accent-cool">
        {member.displayName.charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">
          {member.displayName}
          {member.isMe && <span className="ml-1.5 text-xs text-text-secondary">(you)</span>}
        </p>
        <span className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${tint}`}>
          {bucketLabel(member.bucket)}
        </span>
      </div>
      {!member.isMe && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onEncourage}
            aria-label={`Encourage ${member.displayName}`}
            className="
              flex h-9 w-9 items-center justify-center rounded-full
              bg-accent-cool-soft text-accent-cool
              transition active:scale-95 focus-ring
            "
          >
            <MessageCircleHeart size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onReport}
            aria-label={`Report ${member.displayName}`}
            className="
              flex h-9 w-9 items-center justify-center rounded-full
              text-text-muted
              transition hover:bg-surface-muted focus-ring
            "
          >
            <Flag size={12} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Modals (bottom sheets)
// ─────────────────────────────────────────────────────────────────────

function EncourageSheet({
  groupId,
  recipient,
  onClose,
}: {
  groupId: string;
  recipient: Member;
  onClose: () => void;
}) {
  const [templates, setTemplates] = useState<
    Array<{ id: string; text: string }>
  >([]);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api
      .getEncouragementTemplates()
      .then((r) => setTemplates(r.templates))
      .catch(() => setTemplates([]));
  }, []);

  async function send(templateId?: string, customText?: string) {
    setBusy(true);
    setErr(null);
    try {
      await api.sendEncouragement(groupId, {
        toUserId: recipient.userId,
        templateId,
        customText,
      });
      setSent(true);
      setTimeout(onClose, 900);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Couldn't send right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet onClose={onClose} title={`Encourage ${recipient.displayName}`}>
      {sent ? (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-soft">
            <Check size={18} className="text-success" aria-hidden="true" />
          </span>
          <p className="text-sm text-text-primary">Sent.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => send(t.id)}
                disabled={busy}
                className="
                  w-full rounded-lg border border-glass-border bg-surface px-4 py-3
                  text-left text-sm text-text-primary shadow-card
                  transition active:scale-[0.99]
                  hover:bg-surface-muted focus-ring
                  disabled:cursor-not-allowed disabled:opacity-50
                "
              >
                {t.text}
              </button>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-glass-border">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
              or write your own
            </p>
            <textarea
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              maxLength={280}
              rows={2}
              placeholder="A short note for them."
              className="
                w-full resize-none rounded-lg border border-glass-border bg-surface
                px-4 py-3 text-sm text-text-primary
                placeholder:text-text-muted shadow-card focus-ring
              "
            />
            <button
              type="button"
              onClick={() => custom.trim() && send(undefined, custom.trim())}
              disabled={!custom.trim() || busy}
              className="
                mt-2 flex h-11 w-full items-center justify-center rounded-full
                bg-text-primary text-background text-sm font-medium
                shadow-card transition active:scale-[0.99]
                disabled:cursor-not-allowed disabled:bg-text-soft focus-ring
              "
            >
              {busy ? "Sending…" : "Send"}
            </button>
            {err && (
              <p className="mt-2 text-center text-xs text-warning">{err}</p>
            )}
          </div>
        </>
      )}
    </Sheet>
  );
}

function ReportSheet({
  groupId,
  target,
  onClose,
}: {
  groupId: string;
  target: Member | "group";
  onClose: () => void;
}) {
  const [context, setContext] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function send() {
    if (!context.trim()) return;
    setBusy(true);
    try {
      await api.reportGroup(groupId, {
        targetUserId: target === "group" ? undefined : target.userId,
        context: context.trim(),
      });
      setSent(true);
      setTimeout(onClose, 900);
    } catch {
      /* swallow — the log row is the source of truth on the server */
      setSent(true);
      setTimeout(onClose, 900);
    } finally {
      setBusy(false);
    }
  }

  async function block() {
    if (target === "group") return;
    setBusy(true);
    try {
      await api.blockGroupMember(groupId, target.userId);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      onClose={onClose}
      title={target === "group" ? "Report this group" : `Report ${target.displayName}`}
    >
      {sent ? (
        <p className="py-4 text-center text-sm text-text-primary">
          Thank you — our safety team will review.
        </p>
      ) : (
        <>
          <p className="mb-2 text-sm text-text-secondary">
            What happened? Only what you write here is sent — no AI summary, no
            other context.
          </p>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Briefly describe what happened."
            className="
              w-full resize-none rounded-lg border border-glass-border bg-surface
              px-4 py-3 text-sm text-text-primary
              placeholder:text-text-muted shadow-card focus-ring
            "
          />
          <button
            type="button"
            onClick={send}
            disabled={!context.trim() || busy}
            className="
              mt-3 flex h-11 w-full items-center justify-center rounded-full
              bg-text-primary text-background text-sm font-medium
              shadow-card transition active:scale-[0.99]
              disabled:cursor-not-allowed disabled:bg-text-soft focus-ring
            "
          >
            {busy ? "Sending…" : "Send report"}
          </button>
          {target !== "group" && (
            <button
              type="button"
              onClick={block}
              disabled={busy}
              className="
                mt-2 flex h-11 w-full items-center justify-center gap-1.5 rounded-full
                border border-warning-soft bg-warning-soft text-sm font-medium text-warning
                shadow-card transition active:scale-[0.99] focus-ring
              "
            >
              <UserX size={12} aria-hidden="true" /> Block this person too
            </button>
          )}
        </>
      )}
    </Sheet>
  );
}

function ConfirmLeaveSheet({
  groupId,
  onCancel,
  onConfirmed,
}: {
  groupId: string;
  onCancel: () => void;
  onConfirmed: () => void;
}) {
  const [busy, setBusy] = useState(false);
  async function leave() {
    setBusy(true);
    try {
      await api.leaveGroup(groupId);
      onConfirmed();
    } finally {
      setBusy(false);
    }
  }
  return (
    <Sheet onClose={onCancel} title="Leave this group?">
      <p className="text-sm text-text-secondary">
        You'll stop seeing each other in this group. We won't send anyone a
        notification — it's silent.
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="
            flex flex-1 h-11 items-center justify-center rounded-full
            border border-glass-border bg-surface text-sm font-medium text-text-primary
            shadow-card focus-ring
          "
        >
          Stay
        </button>
        <button
          type="button"
          onClick={leave}
          disabled={busy}
          className="
            flex flex-1 h-11 items-center justify-center rounded-full
            bg-warning text-background text-sm font-medium
            shadow-card transition active:scale-[0.99] focus-ring
            disabled:opacity-50
          "
        >
          {busy ? "Leaving…" : "Leave"}
        </button>
      </div>
    </Sheet>
  );
}

function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/60 px-4 pb-6 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-glass border border-glass-border bg-surface p-5 shadow-card-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold leading-tight tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted focus-ring"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SimpleScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md px-5 pt-8 sm:max-w-lg">
      <div className="rounded-glass border border-glass-border bg-surface p-6 text-center shadow-card">
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Bucket display helpers (frontend mirror of workers/src/lib/groups.ts)
// ─────────────────────────────────────────────────────────────────────

function bucketLabel(b: Bucket): string {
  switch (b) {
    case "high":
      return "85+";
    case "mid":
      return "60–75";
    case "low":
      return "under 60";
    case "hidden":
      return "—";
    case "none":
      return "no read yet";
  }
}

function bucketTint(b: Bucket): string {
  switch (b) {
    case "high":
      return "bg-success-soft text-success";
    case "mid":
      return "bg-accent-cool-soft text-accent-cool";
    case "low":
      return "bg-warning-soft text-warning";
    case "hidden":
    case "none":
      return "bg-surface-muted text-text-secondary";
  }
}
