import { Send, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";
import { useKaiStore } from "../../stores/kaiStore";
import { Button } from "../ui/Button";

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
    <section className="app-panel overflow-hidden">
      <div className="mb-4 flex items-center justify-between border-b border-line">
        <div className="p-4 pb-0">
          <p className="eyebrow">kai check-in</p>
          <h2 className="mt-1 font-display text-3xl font-black tracking-normal">What needs care?</h2>
        </div>
        <div className="mr-4 mt-4 grid size-11 place-items-center rounded-full bg-ink font-serif text-xl italic text-paper">k</div>
      </div>
      <div className="mx-4 mb-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[88%] rounded-kai px-4 py-3 text-sm ${
              message.role === "assistant" ? "bg-warmPaper text-ink" : "ml-auto bg-ink text-paper"
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>
      <div className="mx-4 mb-3 flex flex-wrap gap-2">
        {["school", "friends", "body", "sleep"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setDraft(item)}
            className="focus-ring rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-bold text-muted hover:bg-white hover:text-ink"
          >
            {item}
          </button>
        ))}
      </div>
      <form onSubmit={onSubmit} className="flex gap-2 border-t border-line bg-paper p-3">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="field min-w-0 flex-1"
          placeholder={sending ? "kai is thinking" : "say it messy"}
          disabled={sending}
        />
        <Button aria-label="Send message" disabled={sending}>
          {draft.trim() ? <Send size={18} /> : <Sparkles size={18} />}
        </Button>
      </form>
    </section>
  );
}
