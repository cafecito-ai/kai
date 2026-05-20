// /groups/inbox — encouragement messages received (T-038).
//
// Shows every "thinking about you" / "proud of you" / etc your friends
// have sent. Newest first. Tap to ack (clear the unread badge).

import { ArrowLeft, Check, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../lib/api";

type Message = {
  id: string;
  groupId: string;
  groupName: string;
  fromDisplayName: string;
  text: string;
  acked: boolean;
  createdAt: string;
};

export function GroupInbox() {
  const [messages, setMessages] = useState<Message[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getEncouragementInbox()
      .then((r) => {
        if (!cancelled) setMessages(r.messages);
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function ack(id: string) {
    await api.ackEncouragement(id).catch(() => {});
    setMessages((ms) =>
      (ms ?? []).map((m) => (m.id === id ? { ...m, acked: true } : m)),
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
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
          encouragement
        </p>
        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      <div className="pb-5">
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
          From your people
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Notes sent your way. Tap one to clear it.
        </p>
      </div>

      {messages == null ? (
        <p className="rounded-glass border border-glass-border bg-surface p-6 text-center text-sm text-text-secondary shadow-card">
          Loading…
        </p>
      ) : messages.length === 0 ? (
        <div className="rounded-glass border border-glass-border bg-surface p-6 text-center shadow-card">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-cool-soft">
            <Heart size={22} className="text-accent-cool" aria-hidden="true" />
          </span>
          <p className="mt-4 text-sm text-text-secondary">
            No notes yet. When a friend sends encouragement, it lands here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => !m.acked && ack(m.id)}
              className={`
                w-full rounded-lg border bg-surface px-4 py-3 text-left
                shadow-card transition active:scale-[0.99] focus-ring
                ${m.acked ? "border-glass-border opacity-60" : "border-l-4 border-l-accent-cool border-glass-border"}
              `}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                  {m.fromDisplayName} · {m.groupName}
                </p>
                {m.acked && (
                  <Check size={12} className="text-text-muted" aria-hidden="true" />
                )}
              </div>
              <p className="mt-1.5 text-sm text-text-primary">{m.text}</p>
              <p className="mt-1 font-mono text-[10px] text-text-muted">
                {formatTime(m.createdAt)}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
