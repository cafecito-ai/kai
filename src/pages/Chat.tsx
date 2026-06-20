// /chat — talk to KAI directly.
//
// The user always experiences "KAI" — the safety classifier + routing
// classifier + Mind/Body system prompts all run server-side (wired in
// T-006/T-007/T-008). This page is just the thread UI: KaiMessage bubbles
// for KAI's turns, user bubbles for the user, input + send.
//
// Hydration: on mount, fetch the current conversation via
// api.getCurrentConversation("kai") so the user picks up where they
// left off. Send: POST via api.chat("kai", message, conversationId)
// and append the reply when it lands.

import { ArrowLeft, ArrowUp, ArrowRight, RotateCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { KaiMessage } from "../components/KaiMessage";
import { KaiOrb } from "../components/KaiOrb";
import { api } from "../lib/api";
import { suggestChatAction } from "../lib/chat-actions";
import { buildKaiClientContext } from "../lib/kai-client-context";
import { applyScheduleUpdate } from "../lib/local-schedule";
import { useKaiStore } from "../stores/kaiStore";
import type { ChatMessage } from "../lib/types";

export function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  // Pre-fill the input from a tap-to-talk chip on Home. Cleared after
  // we read it so subsequent renders don't repopulate.
  const initialDraft =
    typeof (location.state as { draft?: string } | null)?.draft === "string"
      ? (location.state as { draft: string }).draft
      : "";
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [draft, setDraft] = useState(initialDraft);
  const [sending, setSending] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  // When the model is unreachable after retries we show an honest error +
  // Retry instead of faking a reply in KAI's voice. Holds the text to re-send.
  const [failedMessage, setFailedMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  // Continuity handoff: a check-in / log can stash a first-person opener; once
  // the thread hydrates we send it through the normal path so Kai continues it.
  const pendingSeed = useKaiStore((s) => s.pendingSeed);
  const setPendingSeed = useKaiStore((s) => s.setPendingSeed);
  const seedFired = useRef(false);

  // Hydrate the latest conversation on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getCurrentConversation("kai");
        if (cancelled) return;
        setConversationId(data.conversationId);
        setMessages(data.messages ?? []);
      } catch {
        // Hydration failure is non-fatal — user can start a fresh thread.
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Consume a handoff seed once the conversation has hydrated.
  useEffect(() => {
    if (hydrating || seedFired.current || !pendingSeed) return;
    seedFired.current = true;
    const seed = pendingSeed;
    setPendingSeed(null);
    void send(seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrating, pendingSeed]);

  // Auto-scroll to the latest message whenever messages change.
  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    // Defer to next frame so the new bubble is laid out first.
    requestAnimationFrame(() => {
      node.scrollTop = node.scrollHeight;
    });
  }, [messages, sending]);

  async function send(override?: string) {
    const trimmed = (override ?? draft).trim();
    if (!trimmed || sending) return;
    const optimisticId = `local-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: optimisticId,
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setDraft("");
    await requestReply(trimmed);
  }

  // Fetch KAI's reply for a message already shown in the thread. Retries a few
  // times on transient failures (the user just sees the typing indicator a beat
  // longer). If it still can't reach the model, we surface an honest error +
  // Retry rather than fabricating a reply — a fake "lost the thread" line in
  // KAI's voice erodes trust. (Crisis turns are server-side and never fail this
  // way — the 988 path always returns its mandatory response.)
  async function requestReply(text: string) {
    setFailedMessage(null);
    setSending(true);
    try {
      // Build a fresh client context per turn so KAI sees the latest
      // hydration, score, missing logs, etc. The rollup is cheap (pure
      // localStorage reads) — well under 50ms.
      const clientContext = buildKaiClientContext();
      let data: Awaited<ReturnType<typeof api.chat>> | null = null;
      let lastErr: unknown;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          data = await api.chat("kai", text, conversationId, clientContext);
          break;
        } catch (e) {
          lastErr = e;
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
          }
        }
      }
      if (!data) throw lastErr;
      setConversationId(data.conversationId);
      // Schedule edits made by talking to KAI ("add gym every Monday at 6")
      // land in the Schedule section automatically.
      if (data.scheduleUpdate) applyScheduleUpdate(data.scheduleUpdate);
      setMessages((prev) => [
        ...prev,
        {
          id: `srv-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          createdAt: new Date().toISOString(),
          // Suppress deep-link chips on a crisis turn.
          safety: Boolean(data.safetyEvent),
        },
      ]);
    } catch {
      // Honest, recoverable error state — not a fake reply. The user's message
      // stays in the thread; they can retry it.
      setFailedMessage(text);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  const isEmpty = !hydrating && messages.length === 0;

  return (
    <div className="mx-auto flex h-[calc(100vh-2rem)] w-full max-w-md flex-col sm:max-w-lg">
      {/* Header */}
      <header className="flex items-center justify-between px-1 pb-3 pt-1">
        <Link
          to="/home"
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted focus-ring"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <div className="flex items-center gap-2">
          <KaiOrb size={28} />
          <span className="font-display text-lg font-semibold tracking-tight">
            KAI
          </span>
        </div>
        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      {/* Thread */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto px-1 pb-4"
        aria-live="polite"
      >
        {hydrating ? (
          <p className="pt-12 text-center text-sm text-text-muted">
            Catching up on where you left off…
          </p>
        ) : isEmpty ? (
          <EmptyState />
        ) : (
          messages.map((m) => {
            if (m.role === "user") {
              return <UserBubble key={m.id}>{m.content}</UserBubble>;
            }
            const action = m.safety ? null : suggestChatAction(m.content);
            return (
              <div key={m.id} className="space-y-2">
                <KaiMessage orbSize={28}>{m.content}</KaiMessage>
                {action ? (
                  <ActionChip
                    label={action.label}
                    onClick={() => navigate(action.route)}
                  />
                ) : null}
              </div>
            );
          })
        )}
        {sending ? <TypingIndicator /> : null}
        {failedMessage && !sending ? (
          <RetryNotice onRetry={() => void requestReply(failedMessage)} />
        ) : null}
      </div>

      {/* Composer */}
      <div className="sticky bottom-0 bg-background pt-2">
        <div className="flex items-end gap-2 rounded-full border border-glass-border bg-surface px-1.5 py-1.5 shadow-card">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Say it messy."
            rows={1}
            className="
              max-h-32 flex-1 resize-none
              border-none bg-transparent
              px-3 py-2 text-base
              text-text-primary placeholder:text-text-muted
              focus:outline-none
            "
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={!draft.trim() || sending}
            aria-label="Send"
            className="
              flex h-10 w-10 shrink-0 items-center justify-center rounded-full
              bg-text-primary text-background
              transition
              active:scale-95
              disabled:cursor-not-allowed disabled:bg-text-soft
              focus-ring
            "
          >
            <ArrowUp size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="space-y-5 px-2 py-8">
      <KaiMessage orbSize={32}>
        Hey. What's on your mind right now?
      </KaiMessage>
      <p className="px-1 text-center text-xs text-text-muted">
        This is private. Crisis support is always one tap away.
      </p>
    </div>
  );
}

function ActionChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="pl-9">
      <button
        type="button"
        onClick={onClick}
        className="
          inline-flex items-center gap-1.5 rounded-full
          border border-accent-cool/40 bg-accent-cool-soft/30
          px-3.5 py-1.5 text-[13px] font-medium text-text-primary
          shadow-card transition hover:bg-accent-cool-soft/50
          active:scale-[0.98] focus-ring
        "
      >
        {label}
        <ArrowRight size={13} aria-hidden="true" />
      </button>
    </div>
  );
}

function RetryNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 py-2" role="alert">
      <p className="text-sm text-text-muted">
        Couldn't reach KAI just now.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="
          inline-flex items-center gap-1.5 rounded-full
          border border-glass-border bg-surface
          px-4 py-1.5 text-[13px] font-medium text-text-primary
          shadow-card transition hover:bg-surface-muted
          active:scale-[0.98] focus-ring
        "
      >
        <RotateCw size={13} aria-hidden="true" />
        Try again
      </button>
    </div>
  );
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-tl-3xl rounded-tr-3xl rounded-br-md rounded-bl-3xl bg-text-primary px-4 py-2.5 text-background shadow-card">
        <p className="text-[15px] leading-snug">{children}</p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5 pl-1">
      <KaiOrb size={28} />
      <div className="rounded-tl-3xl rounded-tr-3xl rounded-br-3xl rounded-bl-md border border-glass-border bg-accent-cool-soft/40 px-5 py-4 shadow-card">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-text-muted [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-text-muted [animation-delay:200ms]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-text-muted [animation-delay:400ms]" />
        </div>
      </div>
    </div>
  );
}
