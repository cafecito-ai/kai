import { ArrowUp, Brain, HeartPulse, Lightbulb, Send, Sparkles } from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { useKaiStore } from "../../stores/kaiStore";
import { Button } from "../ui/Button";
import { KaiMark } from "../ui/AppPrimitives";

type KaiChatMode = "default" | "mental";

export function KaiChat({ embedded = false, mode = "default" }: { embedded?: boolean; mode?: KaiChatMode }) {
  const { messages, send, sending } = useKaiStore();
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const suggestions: Array<{ label: string; prompt: string; icon: typeof Sparkles }> =
    mode === "mental"
      ? [
          { label: "Tiny habit", prompt: "teach this through James Clear", icon: Lightbulb },
          { label: "Meaning", prompt: "what would Viktor Frankl ask?", icon: Sparkles },
          { label: "Control", prompt: "help me use stoic philosophy", icon: ArrowUp },
          { label: "Name it", prompt: "explain this like Daniel Siegel", icon: Brain }
        ]
      : [
          { label: "School", prompt: "school has been stressing me out", icon: Brain },
          { label: "Friends", prompt: "something feels off with my friends", icon: Sparkles },
          { label: "Body", prompt: "my body feels low energy today", icon: HeartPulse },
          { label: "Sleep", prompt: "I need help getting better sleep tonight", icon: Lightbulb }
        ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, sending]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void sendDraft();
  }

  async function sendDraft(text = draft) {
    const message = text.trim();
    if (!message || sending) return;
    setDraft("");
    await send(message, mode === "mental" ? "mental" : "kai");
    inputRef.current?.focus();
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendDraft();
    }
  }

  function applySuggestion(prompt: string) {
    setDraft(prompt);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function sendSuggestion(prompt: string) {
    setDraft("");
    void sendDraft(prompt);
  }

  const shellClass = embedded ? "overflow-hidden rounded-[24px] border border-line bg-white" : "overflow-hidden rounded-calm border border-line bg-white shadow-calm";
  const title = mode === "mental" ? "Ask Kai for a guide lens." : "What is taking up space?";
  const helper = mode === "mental" ? "Pick a lens, or write it messy. Kai keeps it practical." : "Say the real version. Kai will help you choose the next useful move.";

  return (
    <section className={shellClass}>
      <div className="flex items-center justify-between border-b border-line bg-warmPaper/70">
        <div className="p-5 pb-4">
          <p className="eyebrow">{mode === "mental" ? "mental guide chat" : "kai check-in"}</p>
          <h2 className="mt-1 font-display text-2xl font-black leading-tight tracking-normal sm:text-3xl">{title}</h2>
          <p className="mt-2 max-w-sm text-sm font-semibold leading-5 text-muted">{helper}</p>
        </div>
        <div className="mr-5">
          <KaiMark size="md" />
        </div>
      </div>
      <div
        className="max-h-[42vh] space-y-3 overflow-y-auto px-4 py-4 sm:max-h-[26rem]"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Chat with Kai"
      >
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
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-2 overflow-x-auto border-t border-line px-3 py-3" role="group" aria-label="Topic suggestions">
        {suggestions.map((item) => {
          const Icon = item.icon;
          return (
          <button
            key={item.label}
            type="button"
            onClick={() => applySuggestion(item.prompt)}
            onDoubleClick={() => sendSuggestion(item.prompt)}
            aria-label={`Use "${item.prompt}" as your message`}
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
