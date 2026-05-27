// /groups — your groups list (T-036 + T-037 list view).
//
// Lists every group you're in. From here you can:
//   - Create a new group (max 3 you're in at once)
//   - Join with an invite code
//   - Open a group to see members + send encouragement
//
// Empty state: clean CTA to create or join.

import { ArrowRight, ChevronRight, Plus, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../lib/api";

type Group = {
  id: string;
  name: string;
  inviteCode: string;
  inviteExpires: string;
  inviteExpired: boolean;
  memberCount: number;
  hideScore: boolean;
};

type Phase = "loading" | "ready";

export function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [phase, setPhase] = useState<Phase>("loading");
  const [mode, setMode] = useState<"list" | "create" | "join">("list");
  const [newName, setNewName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .listGroups()
      .then((r) => {
        if (cancelled) return;
        setGroups(r.groups);
        setPhase("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setGroups([]);
        setPhase("ready");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function create() {
    if (!newName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const r = await api.createGroup(newName.trim());
      setGroups([
        {
          id: r.group.id,
          name: r.group.name,
          inviteCode: r.group.inviteCode,
          inviteExpires: r.group.inviteExpires,
          inviteExpired: false,
          memberCount: 1,
          hideScore: false,
        },
        ...groups,
      ]);
      setNewName("");
      setMode("list");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Couldn't create group.");
    } finally {
      setBusy(false);
    }
  }

  async function join() {
    if (!joinCode.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api.joinGroup(joinCode.trim().toUpperCase());
      // Refetch full list — easier than constructing the row.
      const r = await api.listGroups();
      setGroups(r.groups);
      setJoinCode("");
      setMode("list");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Couldn't join — check the code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-2 pb-6 sm:max-w-lg">
      <header className="flex items-center justify-between pb-3">
        <div className="h-10 w-10" aria-hidden="true" />
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
          groups
        </p>
        <Link
          to="/groups/inbox"
          aria-label="Encouragement inbox"
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted focus-ring"
        >
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </header>

      <div className="pb-6">
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
          Your groups
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Small circles of people you actually trust. Scores show as rough
          buckets — never an exact number.
        </p>
      </div>

      {phase === "loading" ? (
        <div className="rounded-glass border border-glass-border bg-surface p-6 text-center text-sm text-text-secondary shadow-card">
          Loading…
        </div>
      ) : (
        <>
          {/* Mode tabs */}
          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => setMode("create")}
              className="
                flex flex-1 items-center justify-center gap-1.5 rounded-full
                border border-glass-border bg-surface px-3 py-2 text-xs font-medium
                shadow-card transition hover:bg-surface-muted focus-ring
              "
            >
              <Plus size={12} aria-hidden="true" /> Create
            </button>
            <button
              type="button"
              onClick={() => setMode("join")}
              className="
                flex flex-1 items-center justify-center gap-1.5 rounded-full
                border border-glass-border bg-surface px-3 py-2 text-xs font-medium
                shadow-card transition hover:bg-surface-muted focus-ring
              "
            >
              <UserPlus size={12} aria-hidden="true" /> Join
            </button>
          </div>

          {mode === "create" && (
            <CreateForm
              name={newName}
              setName={setNewName}
              onSubmit={create}
              onCancel={() => {
                setMode("list");
                setError(null);
              }}
              busy={busy}
            />
          )}
          {mode === "join" && (
            <JoinForm
              code={joinCode}
              setCode={setJoinCode}
              onSubmit={join}
              onCancel={() => {
                setMode("list");
                setError(null);
              }}
              busy={busy}
            />
          )}
          {error && (
            <p className="mb-3 rounded-lg border border-warning-soft bg-warning-soft px-3 py-2 text-sm text-warning">
              {error}
            </p>
          )}

          {groups.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-2">
              {groups.map((g) => (
                <GroupRow key={g.id} group={g} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function GroupRow({ group }: { group: Group }) {
  return (
    <Link
      to={`/groups/${group.id}`}
      className="
        flex items-center gap-3 rounded-lg border border-glass-border bg-surface px-4 py-3
        shadow-card transition hover:bg-surface-muted focus-ring
      "
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft">
        <Users size={16} className="text-accent" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">{group.name}</p>
        <p className="truncate text-xs text-text-secondary">
          {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
          {group.hideScore && " · your score hidden"}
        </p>
      </div>
      <ChevronRight size={16} className="text-text-muted" aria-hidden="true" />
    </Link>
  );
}

function CreateForm({
  name,
  setName,
  onSubmit,
  onCancel,
  busy,
}: {
  name: string;
  setName: (s: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  return (
    <div className="mb-4 rounded-glass border border-glass-border bg-surface p-4 shadow-card">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
        new group
      </p>
      <input
        type="text"
        value={name}
        maxLength={24}
        onChange={(e) => setName(e.target.value)}
        placeholder="Group name (max 24)"
        className="
          mt-2.5 w-full rounded-lg border border-glass-border bg-surface
          px-4 py-3 text-base text-text-primary
          placeholder:text-text-muted shadow-card focus-ring
        "
      />
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="
            flex flex-1 items-center justify-center rounded-full
            border border-glass-border bg-surface px-3 py-2 text-sm font-medium
            text-text-secondary shadow-card transition hover:bg-surface-muted focus-ring
          "
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!name.trim() || busy}
          className="
            flex flex-[2] items-center justify-center rounded-full
            bg-text-primary px-3 py-2 text-sm font-medium text-background
            shadow-card transition active:scale-[0.99]
            disabled:cursor-not-allowed disabled:bg-text-soft focus-ring
          "
        >
          {busy ? "Creating…" : "Create group"}
        </button>
      </div>
    </div>
  );
}

function JoinForm({
  code,
  setCode,
  onSubmit,
  onCancel,
  busy,
}: {
  code: string;
  setCode: (s: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  return (
    <div className="mb-4 rounded-glass border border-glass-border bg-surface p-4 shadow-card">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
        join with code
      </p>
      <input
        type="text"
        value={code}
        maxLength={8}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="ABCD2345"
        autoCapitalize="characters"
        className="
          mt-2.5 w-full rounded-lg border border-glass-border bg-surface
          px-4 py-3 text-center font-mono text-xl tracking-[0.2em] uppercase text-text-primary
          placeholder:text-text-muted shadow-card focus-ring
        "
      />
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="
            flex flex-1 items-center justify-center rounded-full
            border border-glass-border bg-surface px-3 py-2 text-sm font-medium
            text-text-secondary shadow-card transition hover:bg-surface-muted focus-ring
          "
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={code.length < 4 || busy}
          className="
            flex flex-[2] items-center justify-center rounded-full
            bg-text-primary px-3 py-2 text-sm font-medium text-background
            shadow-card transition active:scale-[0.99]
            disabled:cursor-not-allowed disabled:bg-text-soft focus-ring
          "
        >
          {busy ? "Joining…" : "Join"}
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-glass border border-glass-border bg-surface p-6 text-center shadow-card">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft">
        <Users size={22} className="text-accent" aria-hidden="true" />
      </span>
      <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight">
        No groups yet
      </h2>
      <p className="mt-2 max-w-xs text-sm text-text-secondary mx-auto">
        Create a group and invite people you actually trust. Or paste a friend's
        invite code above.
      </p>
    </div>
  );
}
