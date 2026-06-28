// The typed input — used both as the standalone typed path and as the
// always-present fallback inside the voice flow. One contract: onSubmit(text).

import { useState } from "react";
import { Send } from "lucide-react";

export function TypedFallback({
  onSubmit,
  disabled,
  placeholder = "Say it however you want…",
}: {
  onSubmit: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    onSubmit(text);
    setValue("");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-end gap-2"
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        rows={1}
        disabled={disabled}
        placeholder={placeholder}
        aria-label="Your reply to Kai"
        className="max-h-32 min-h-[3rem] flex-1 resize-none rounded-2xl border border-glass-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus-ring disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        aria-label="Send"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-text-primary text-background shadow-card transition active:scale-95 disabled:cursor-not-allowed disabled:bg-text-soft focus-ring"
      >
        <Send size={18} aria-hidden="true" />
      </button>
    </form>
  );
}
