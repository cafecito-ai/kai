// ChatHistoryDrawer — a bottom-sheet list of past KAI conversations. Open one,
// delete one, or start a new chat. Mirrors the QuickActionSheet / GroupDetail
// sheet pattern (scrim + rounded-top panel + fade-slide-up + safe-area).
//
// The thread itself lives in Chat.tsx state; this drawer just lists and routes.

import { useEffect, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

import { api } from "../lib/api";
import { isGeneratedConversation } from "../lib/generated-convos";
import type { ConversationSummary } from "../lib/types";

// D1's CURRENT_TIMESTAMP returns "YYYY-MM-DD HH:MM:SS" with no timezone, so we
// normalize to UTC before parsing or the time reads hours off.
function relativeTime(iso?: string): string {
  if (!iso) return "";
  const norm = /[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso.replace(" ", "T")}Z`;
  const t = new Date(norm).getTime();
  if (Number.isNaN(t)) return "";
  const mins = Math.round((Date.now() - t) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(norm).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ChatHistoryDrawer({
  open,
  onClose,
  activeId,
  onOpen,
  onNew,
  onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  activeId: string | null;
  onOpen: (id: string) => void;
  onNew: () => void;
  onDeleted: (id: string) => void;
}) {
  const [rows, setRows] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setConfirmId(null);
    (async () => {
      try {
        const data = await api.listConversations("kai");
        // Hide throwaway sub-system generation conversations.
        if (!cancelled) setRows((data.conversations ?? []).filter((c) => !isGeneratedConversation(c.id)));
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function remove(id: string) {
    const prev = rows;
    setRows((r) => r.filter((c) => c.id !== id)); // optimistic
    setConfirmId(null);
    onDeleted(id);
    try {
      await api.deleteConversation(id);
    } catch {
      setRows(prev); // re-insert on failure
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-text-primary/40 backdrop-blur-sm"
      />

      <div
        className="relative flex max-h-[80vh] w-full max-w-md flex-col rounded-tl-3xl rounded-tr-3xl border-l border-r border-t border-glass-border bg-surface p-5 shadow-glass-lg animate-fade-slide-up sm:max-w-lg"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center justify-between gap-3 pb-3">
          <h2 className="font-display text-lg font-semibold tracking-tight">Your chats</h2>
          <button
            type="button"
            onClick={onNew}
            className="inline-flex items-center gap-1.5 rounded-full bg-text-primary px-3.5 py-2 text-xs font-medium text-background shadow-card transition active:scale-95 focus-ring"
          >
            <Plus size={13} aria-hidden="true" />
            New chat
          </button>
        </div>

        <div className="-mr-1 flex-1 space-y-2 overflow-y-auto pr-1">
          {loading ? (
            <p className="py-8 text-center text-sm text-text-muted">Loading…</p>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center">
              <p className="font-display text-base font-medium text-text-primary">No past chats yet</p>
              <p className="mt-1 text-sm text-text-secondary">Start one and it'll show up here.</p>
            </div>
          ) : (
            rows.map((row) => {
              const isActive = row.id === activeId;
              const confirming = confirmId === row.id;
              return (
                <div
                  key={row.id}
                  className={`flex items-center gap-2 rounded-lg border bg-surface px-3 py-2.5 shadow-card transition ${
                    isActive ? "border-accent" : "border-glass-border"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onOpen(row.id)}
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left focus-ring rounded"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        isActive ? "bg-accent-soft text-accent" : "bg-surface-muted text-text-secondary"
                      }`}
                    >
                      <Pencil size={14} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-text-primary">{row.title}</span>
                      <span className="block text-xs text-text-muted">{relativeTime(row.lastMessageAt)}</span>
                    </span>
                  </button>

                  {confirming ? (
                    <span className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        aria-label="Confirm delete"
                        onClick={() => void remove(row.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-danger-soft text-danger transition active:scale-95 focus-ring"
                      >
                        <Check size={15} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label="Cancel delete"
                        onClick={() => setConfirmId(null)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-text-secondary transition active:scale-95 focus-ring"
                      >
                        <X size={15} aria-hidden="true" />
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      aria-label={`Delete ${row.title}`}
                      onClick={() => setConfirmId(row.id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition hover:bg-surface-muted hover:text-danger focus-ring"
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
