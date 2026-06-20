// format-kai-reply — turn one of KAI's plain-text replies into structured
// blocks so the UI can render it for SCANNING instead of as one wall of text.
//
// KAI's prompt deliberately bans markdown headers/bold and favors flowing
// sentences, but for real plans/options it lays out short numbered or dashed
// lists, one per line. The chat bubble used to dump the whole string into a
// single node, which collapses those line breaks into a paragraph soup. This
// parser preserves the structure the model intended:
//   - blank-line- or newline-separated thoughts become separate paragraphs
//   - consecutive "1)" / "1." lines become an ordered list
//   - consecutive "-" / "•" / "*" lines become an unordered list
//
// It is intentionally conservative: a single flowing paragraph (the common
// case) comes back as exactly one paragraph block — we never invent structure.

export type KaiBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] };

const BULLET = /^[-•*]\s+(.*)$/;
const NUMBERED = /^\d+[.)]\s+(.*)$/;

export function formatKaiReply(raw: string): KaiBlock[] {
  const lines = raw.replace(/\r\n/g, "\n").split("\n").map((l) => l.trim());
  const blocks: KaiBlock[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushList = () => {
    if (list && list.items.length > 0) blocks.push({ type: "list", ...list });
    list = null;
  };

  for (const line of lines) {
    if (!line) {
      flushList();
      continue;
    }
    const numbered = NUMBERED.exec(line);
    const bullet = BULLET.exec(line);
    if (numbered) {
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(numbered[1].trim());
    } else if (bullet) {
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(bullet[1].trim());
    } else {
      flushList();
      blocks.push({ type: "paragraph", text: line });
    }
  }
  flushList();

  // A single empty-or-whitespace reply shouldn't render an empty bubble; let the
  // caller fall back to the raw string.
  return blocks;
}
