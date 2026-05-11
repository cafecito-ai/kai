import { Send } from "lucide-react";
import { FormEvent, useState } from "react";
import { useKaiStore } from "../../stores/kaiStore";
import { Button } from "../ui/Button";

export function KaiChat() {
  const { messages, send } = useKaiStore();
  const [draft, setDraft] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    send(draft.trim());
    setDraft("");
  }

  return (
    <section className="rounded-kai border border-ink/10 bg-white p-4 shadow-sm">
      <div className="mb-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[85%] rounded-kai px-4 py-3 text-sm ${
              message.role === "assistant" ? "bg-sky/15 text-ink" : "ml-auto bg-ink text-paper"
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="focus-ring min-w-0 flex-1 rounded-kai border border-ink/15 bg-paper px-3 py-2"
          placeholder="Tell Kai what's up"
        />
        <Button aria-label="Send message">
          <Send size={18} />
        </Button>
      </form>
    </section>
  );
}
