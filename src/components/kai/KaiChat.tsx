import { ArrowUp, Brain, Send, Smartphone, Sparkles, Trophy, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { kaiPromptChips } from "../../lib/kai-actions";
import { getKaiMemoryItems } from "../../lib/kai-memory";
import { useKaiStore } from "../../stores/kaiStore";
import { Button } from "../ui/Button";
import { KaiMark } from "../ui/AppPrimitives";

type KaiChatMode = "default" | "mental";

export function KaiChat({
  embedded = false,
  mode = "default",
  onOpenAction
}: {
  embedded?: boolean;
  mode?: KaiChatMode;
  onOpenAction?: () => void;
}) {
  const chatEngine = mode === "mental" ? "mental" : "kai";
  const messages = useKaiStore((state) => state.chats[chatEngine].messages);
  const nextAction = useKaiStore((state) => state.chats[chatEngine].nextAction);
  const sending = useKaiStore((state) => state.chats[chatEngine].sending);
  const hydrated = useKaiStore((state) => state.chats[chatEngine].hydrated);
  const send = useKaiStore((state) => state.send);
  const hydrate = useKaiStore((state) => state.hydrate);
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const memoryItems = getKaiMemoryItems(messages);
  const suggestions: Array<{ label: string; prompt: string; icon: LucideIcon }> =
    mode === "mental"
      ? [
          { label: "Talk", prompt: "I’m overthinking and need to calm it down", icon: Brain },
          { label: "Confidence", prompt: "Help me stop being so hard on myself", icon: Trophy },
          { label: "Social", prompt: "The group chat made me feel left out", icon: UsersRound },
          { label: "Screen", prompt: "I keep doomscrolling and comparing myself", icon: Smartphone },
          { label: "Control", prompt: "Help me focus on what I can control", icon: ArrowUp },
          { label: "Reset", prompt: "I am overwhelmed and need to reset", icon: Sparkles }
        ]
      : kaiPromptChips().map((action) => ({ label: action.chip, prompt: action.example, icon: action.icon }));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, sending]);

  useEffect(() => {
    let cancelled = false;
    if (hydrated) return;
    void api.getCurrentConversation(chatEngine).then((conversation) => {
      if (!cancelled) hydrate(chatEngine, conversation);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [chatEngine, hydrate, hydrated]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void sendDraft();
  }

  async function sendDraft(text = draft) {
    const message = text.trim();
    if (!message || sending) return;
    setDraft("");
    await send(message, chatEngine);
    inputRef.current?.focus();
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendDraft();
    }
  }

  function sendSuggestion(prompt: string) {
    setDraft("");
    void sendDraft(prompt);
  }

  const shellClass = embedded ? "overflow-hidden rounded-[24px] border border-line bg-white" : "overflow-hidden rounded-calm border border-line bg-white shadow-calm";
  const title = mode === "mental" ? "Talk it out." : "What’s actually going on?";
  const helper = mode === "mental" ? "No perfect words. Kai will help you steady it." : "Say it like you’d text it. Kai will pick the next move.";

  return (
    <section className={shellClass}>
      {!embedded && (
        <div className="flex items-center justify-between border-b border-line bg-warmPaper/70">
          <div className="p-5 pb-4">
            <p className="eyebrow">{mode === "mental" ? "mind" : "kai"}</p>
            <h2 className="mt-1 font-display text-2xl font-black leading-tight tracking-normal sm:text-3xl">{title}</h2>
            <p className="mt-2 max-w-sm text-sm font-semibold leading-5 text-muted">{helper}</p>
          </div>
          <div className="mr-5">
            <KaiMark size="md" />
          </div>
        </div>
      )}
      <div
        className={`${embedded ? "max-h-[52svh]" : "max-h-[42vh] sm:max-h-[26rem]"} space-y-3 overflow-y-auto px-4 py-4`}
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Chat with Kai"
      >
        {memoryItems.length > 0 && (
          <div className="rounded-[20px] border border-line bg-paper px-4 py-3 text-left shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted">Kai remembers</p>
            <div className="mt-3 space-y-2">
              {memoryItems.map((item) => (
                <div key={item.id} className="flex gap-2">
                  <span className={`mt-1 size-2 shrink-0 rounded-full ${item.kind === "saved" ? "bg-reset" : "bg-ink/35"}`} />
                  <span className="min-w-0">
                    <span className="block text-xs font-black text-ink">{item.label}</span>
                    <span className="mt-0.5 block text-sm font-semibold leading-5 text-muted">{item.body}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[88%] rounded-[22px] px-4 py-3 text-sm font-semibold leading-6 shadow-sm ${
              message.role === "assistant" ? "bg-warmPaper text-ink" : "ml-auto bg-ink text-paper"
            }`}
          >
            <span className="sr-only">{message.role === "assistant" ? "Kai said: " : "You said: "}</span>
            {message.content}
          </div>
        ))}
        {sending && (
          <div className="max-w-[82%] rounded-[22px] bg-warmPaper px-4 py-3 text-sm font-semibold leading-6 text-muted shadow-sm">
            <span className="sr-only">Kai is thinking.</span>
            <span className="inline-flex items-center gap-1.5" aria-hidden="true">
              <span className="size-2 rounded-full bg-muted/50" />
              <span className="size-2 rounded-full bg-muted/40" />
              <span className="size-2 rounded-full bg-muted/30" />
            </span>
          </div>
        )}
        {nextAction && !sending && (
          <Link
            to={nextAction.route}
            onClick={onOpenAction}
            className="focus-ring ml-auto block max-w-[94%] rounded-[22px] bg-[#111116] px-4 py-3 text-left text-white shadow-sm transition hover:-translate-y-0.5"
          >
            <span className="flex items-start gap-3">
              <span className={`grid size-10 shrink-0 place-items-center rounded-full ${nextAction.tone}`}>
                <nextAction.icon size={18} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-black uppercase tracking-wider text-white/42">Kai's read</span>
                <span className="mt-1 block text-base font-black leading-tight text-white">{nextAction.label}</span>
                <span className="mt-1 block text-sm font-semibold leading-5 text-white/64">{nextAction.reason}</span>
              </span>
            </span>
          </Link>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className={`${embedded ? "flex flex-wrap" : "flex overflow-x-auto"} gap-2 border-t border-line px-3 py-3`} role="group" aria-label="Things Kai can help with">
        {suggestions.map((item) => {
          const Icon = item.icon;
          return (
          <button
            key={item.label}
            type="button"
            onClick={() => sendSuggestion(item.prompt)}
            aria-label={`Ask Kai: ${item.prompt}`}
            className="focus-ring inline-flex shrink-0 items-center gap-2 rounded-full border border-line bg-paper px-3 py-2 text-xs font-black text-muted hover:bg-white hover:text-ink"
          >
            <Icon size={14} aria-hidden="true" />
            {item.label}
          </button>
        );
        })}
      </div>
      <form onSubmit={onSubmit} className="flex items-end gap-2 border-t border-line bg-paper p-3">
        <label htmlFor="kai-chat-input" className="sr-only">
          Message to Kai
        </label>
        <textarea
          ref={inputRef}
          id="kai-chat-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onInputKeyDown}
          rows={1}
          className="field max-h-32 min-h-12 min-w-0 flex-1 resize-none py-3"
          placeholder={sending ? "kai is thinking" : "say it messy"}
          disabled={sending}
        />
        <Button aria-label="Send message" disabled={sending || !draft.trim()} className="size-12 shrink-0 rounded-full p-0">
          {draft.trim() ? <Send size={18} aria-hidden="true" /> : <Sparkles size={18} aria-hidden="true" />}
        </Button>
      </form>
    </section>
  );
}
