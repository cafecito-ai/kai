import { Fragment, type ReactNode } from "react";

/**
 * ArticleBody renders the lightly-Markdown-formatted body strings used by
 * every primer catalog. The previous per-component renderer just split on
 * blank lines and emitted <p>, which flattened bullets, numbered steps,
 * and **bold** into plain runs of text. That was flagged across most
 * primers in code review.
 *
 * What this renders:
 *   - Paragraphs separated by blank lines.
 *   - Unordered bullets via lines starting with `- ` or `* `.
 *   - Ordered lists via lines like `1. `, `2. `, etc.
 *   - Inline **bold** and *italic* spans within paragraphs and list items.
 *   - "Section headers" — a paragraph that is solely **Bold text.** —
 *     get rendered with extra weight + spacing.
 *
 * Deliberately not supported (out of scope): tables, code blocks, images,
 * footnotes, links. Primer bodies don't use these.
 */

type Props = {
  body: string;
  /** Optional class name applied to the outer wrapper. */
  className?: string;
};

type Block =
  | { kind: "paragraph"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] };

export function ArticleBody({ body, className }: Props) {
  const blocks = parseBlocks(body);
  return (
    <div className={className ?? "space-y-3 text-sm leading-6 text-ink"}>
      {blocks.map((block, idx) => renderBlock(block, idx))}
    </div>
  );
}

function renderBlock(block: Block, key: number): ReactNode {
  if (block.kind === "paragraph") {
    if (isStandaloneHeader(block.text)) {
      const inner = block.text.trim().replace(/^\*\*(.+?)\*\*\.?$/, "$1");
      return (
        <p key={key} className="pt-1 text-sm font-bold leading-6 text-ink">
          {renderInline(inner)}
        </p>
      );
    }
    return (
      <p key={key} className="text-sm leading-6 text-ink">
        {renderInline(block.text)}
      </p>
    );
  }
  if (block.kind === "ul") {
    return (
      <ul key={key} className="space-y-1 pl-5 text-sm leading-6 text-ink">
        {block.items.map((item, i) => (
          <li key={i} className="list-disc">
            {renderInline(item)}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ol key={key} className="space-y-1 pl-5 text-sm leading-6 text-ink">
      {block.items.map((item, i) => (
        <li key={i} className="list-decimal">
          {renderInline(item)}
        </li>
      ))}
    </ol>
  );
}

/**
 * Parse a body into a flat list of paragraph / ul / ol blocks. Paragraphs
 * are separated by blank lines; consecutive bullet or numbered lines
 * collapse into a single list block.
 */
export function parseBlocks(body: string): Block[] {
  const blocks: Block[] = [];
  const paragraphs = body
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  for (const para of paragraphs) {
    const lines = para.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) continue;

    if (lines.every((l) => /^[-*]\s+/.test(l))) {
      blocks.push({
        kind: "ul",
        items: lines.map((l) => l.replace(/^[-*]\s+/, ""))
      });
      continue;
    }

    if (lines.every((l) => /^\d+\.\s+/.test(l))) {
      blocks.push({
        kind: "ol",
        items: lines.map((l) => l.replace(/^\d+\.\s+/, ""))
      });
      continue;
    }

    // Mixed-content paragraph (no list markers, or mixed). Re-join with
    // single spaces so explicit line-breaks in the source don't render as
    // mid-paragraph hard breaks.
    blocks.push({ kind: "paragraph", text: lines.join(" ") });
  }
  return blocks;
}

function isStandaloneHeader(text: string): boolean {
  // A paragraph that's just "**Some words.**" or "**Some words:**" with
  // optional trailing punctuation. Used as a section header in body copy.
  return /^\*\*[^*]+?\*\*\.?:?$/.test(text.trim());
}

/**
 * Render a span of inline text with **bold** and *italic* support.
 * Conservative: only handles the patterns the primer bodies use.
 */
export function renderInline(text: string): ReactNode {
  // Tokenize: alternating non-marker text and marked spans.
  const tokens: { kind: "text" | "bold" | "italic"; value: string }[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ kind: "text", value: text.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) {
      tokens.push({ kind: "bold", value: match[1] });
    } else if (match[2] !== undefined) {
      tokens.push({ kind: "italic", value: match[2] });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    tokens.push({ kind: "text", value: text.slice(lastIndex) });
  }
  if (tokens.length === 0) {
    return text;
  }
  return tokens.map((tok, i) => {
    if (tok.kind === "bold") return <strong key={i} className="font-semibold">{tok.value}</strong>;
    if (tok.kind === "italic") return <em key={i}>{tok.value}</em>;
    return <Fragment key={i}>{tok.value}</Fragment>;
  });
}
