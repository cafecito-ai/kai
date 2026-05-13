import { Send, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";
import { useKaiStore } from "../../stores/kaiStore";
import { Button } from "../ui/Button";
import { KaiMark } from "../ui/AppPrimitives";

export function KaiChat() {
  const { messages, send, sending } = useKaiStore();
  const [draft, setDraft] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    void send(draft.trim());
    setDraft("");
  }

  return (
    <section className="overflow-hidden rounded-calm border border-line bg-white shadow-calm">
      <div className="mb-4 flex items-center justify-between border-b border-line bg-warmPaper/70">
        <div className="p-5 pb-4">
          <p className="eyebrow">kai check-in</p>
          <h2 className="mt-1 font-display text-3xl font-black tracking-normal">What is taking up space?</h2>
        </div>
        <div className="mr-5">
          <KaiMark size="md" />
        </div>
      </div>
      <div
        className="mx-4 mb-4 space-y-3"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Chat with Kai"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[88%] rounded-[22px] px-4 py-3 text-sm font-medium leading-6 ${
              message.role === "assistant" ? "bg-warmPaper text-ink" : "ml-auto bg-ink text-paper"
            }`}
          >
            <span className="sr-only">{message.role === "assistant" ? "Kai said: " : "You said: "}</span>
            {message.content}
          </div>
        ))}
      </div>
      <div className="mx-4 mb-3 flex flex-wrap gap-2" role="group" aria-label="Topic suggestions">
        {["school", "friends", "body", "sleep"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setDraft(item)}
            aria-label={`Use "${item}" as your message`}
            className="focus-ring rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-bold text-muted hover:bg-white hover:text-ink"
          >
            {item}
          </button>
        ))}
      </div>
      <form onSubmit={onSubmit} className="flex gap-2 border-t border-line bg-paper p-3">
        <label htmlFor="kai-chat-input" className="sr-only">
          Message to Kai
        </label>
        <input
          id="kai-chat-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="field min-w-0 flex-1"
          placeholder={sending ? "kai is thinking" : "say it messy"}
          disabled={sending}
        />
        <Button aria-label="Send message" disabled={sending}>
          {draft.trim() ? <Send size={18} aria-hidden="true" /> : <Sparkles size={18} aria-hidden="true" />}
        </Button>
      </form>
    </section>
  );
}
