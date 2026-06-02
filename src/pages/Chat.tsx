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

import { ArrowLeft, ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { KaiMessage } from "../components/KaiMessage";
import { KaiOrb } from "../components/KaiOrb";
import { api } from "../lib/api";
import { buildKaiClientContext } from "../lib/kai-client-context";
import { useKaiStore } from "../stores/kaiStore";
import type { ChatMessage } from "../lib/types";

export function Chat() {
  const location = useLocation();
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
    setSending(true);
    try {
      // Build a fresh client context per turn so KAI sees the latest
      // hydration, score, missing logs, etc. The rollup is cheap (pure
      // localStorage reads) — well under 50ms.
      const clientContext = buildKaiClientContext();
      const data = await api.chat("kai", trimmed, conversationId, clientContext);
      setConversationId(data.conversationId);
      setMessages((prev) => [
        ...prev,
        {
          id: `srv-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch {
      // Show a soft inline failure as a KAI message — no stack traces, no
      // status codes (v3 §9 error copy rules).
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "KAI's thinking slow today — tap to try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
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
          messages.map((m) =>
            m.role === "user" ? (
              <UserBubble key={m.id}>{m.content}</UserBubble>
            ) : (
              <KaiMessage key={m.id} orbSize={28}>
                {m.content}
              </KaiMessage>
            ),
          )
        )}
        {sending ? <TypingIndicator /> : null}
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
