import { Send, Sparkles } from "lucide-react";
import { FormEvent, Fragment, useId, useState } from "react";
import { useKaiStore } from "../../stores/kaiStore";
import { useUserStore } from "../../stores/userStore";
import { CrisisResourceCard } from "../safety/CrisisResourceCard";
import { DisclosureBanner } from "../safety/DisclosureBanner";
import { Button } from "../ui/Button";
import { KaiMark } from "../ui/AppPrimitives";
import { KaiTypingIndicator } from "./KaiTypingIndicator";

export function KaiChat({ embedded = false }: { embedded?: boolean }) {
  const { messages, send, sending } = useKaiStore();
  const kaiName = useUserStore((state) => state.kaiName);
  const [draft, setDraft] = useState("");
  const inputId = useId();

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    void send(draft.trim());
    setDraft("");
  }

  const shellClass = embedded ? "overflow-hidden rounded-[24px] border border-line bg-white" : "overflow-hidden rounded-calm border border-line bg-white shadow-calm";
  const lowerKaiName = kaiName.toLowerCase();

  return (
    <section className={shellClass}>
      <div className="mb-4 flex items-center justify-between border-b border-line bg-warmPaper/70">
        <div className="p-5 pb-4">
          <p className="eyebrow">{lowerKaiName} check-in</p>
          <h2 className="mt-1 font-display text-3xl font-black tracking-normal">What is taking up space?</h2>
        </div>
        <div className="mr-5">
          <KaiMark size="md" />
        </div>
      </div>
      <div className="mx-4 mb-3">
        <DisclosureBanner />
      </div>
      <div
        className="mx-4 mb-4 space-y-3"
        aria-live="polite"
        aria-relevant="additions"
        aria-label={`Chat with ${kaiName}`}
      >
        {messages.map((message) => (
          <Fragment key={message.id}>
            <div
              className={`max-w-[88%] rounded-[22px] px-4 py-3 text-sm font-medium leading-6 ${
                message.role === "assistant" ? "bg-warmPaper text-ink" : "ml-auto bg-ink text-paper"
              }`}
            >
              <span className="sr-only">{message.role === "assistant" ? `${kaiName} said: ` : "You said: "}</span>
              {message.content}
            </div>
            {message.safetyEvent && <CrisisResourceCard />}
          </Fragment>
        ))}
        {sending && <KaiTypingIndicator />}
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
        <label htmlFor={inputId} className="sr-only">
          Message to {kaiName}
        </label>
        <input
          id={inputId}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="field min-w-0 flex-1"
          placeholder={sending ? `${lowerKaiName} is thinking` : "say it messy"}
          disabled={sending}
        />
        <Button aria-label="Send message" disabled={sending}>
          {draft.trim() ? <Send size={18} aria-hidden="true" /> : <Sparkles size={18} aria-hidden="true" />}
        </Button>
      </form>
    </section>
  );
}
