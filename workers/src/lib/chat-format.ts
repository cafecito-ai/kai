type ReplyMode = "mind" | "body" | "general";

const MAX_PARAGRAPH_CHARS = 150;

export function formatKaiReply(rawReply: string, mode: ReplyMode = "general") {
  const cleaned = rawReply
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!cleaned) return closingPrompt("", mode).trim();

  const paragraphs = cleaned
    .split(/\n{2,}/)
    .flatMap((paragraph) => splitLongParagraph(paragraph.trim()))
    .filter(Boolean);

  const body = paragraphs.join("\n\n");
  if (endsWithKeepGoingOffer(body)) return body;
  return `${body}\n\n${closingPrompt(body, mode)}`;
}

function splitLongParagraph(paragraph: string) {
  if (paragraph.length <= MAX_PARAGRAPH_CHARS) return [paragraph];
  const sentences = paragraph.match(/[^.!?]+[.!?]+["')\]]?|[^.!?]+$/g)?.map((s) => s.trim()) ?? [paragraph];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const next = current ? `${current} ${sentence}` : sentence;
    if (next.length > MAX_PARAGRAPH_CHARS && current) {
      chunks.push(current);
      current = sentence;
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function endsWithKeepGoingOffer(reply: string) {
  const tail = reply.slice(-220).toLowerCase();
  return /[?]$/.test(reply.trim()) && (
    tail.includes("philosophy lens") ||
    tail.includes("stoic") ||
    tail.includes("discipline lens") ||
    tail.includes("purpose lens") ||
    tail.includes("next move") ||
    tail.includes("make it practical")
  );
}

function closingPrompt(reply: string, mode: ReplyMode) {
  if (mode === "body") {
    return "Want the discipline lens on this, or should we turn it into one clean next move?";
  }
  if (mentionsRelationship(reply)) {
    return "Want the deeper read on what this says about you, or the Stoic next move?";
  }
  if (mentionsPurpose(reply)) {
    return "Want the purpose lens on this, or should we make it practical for today?";
  }
  return "Want a quick philosophy lens on this, or should we turn it into one next move?";
}

function mentionsRelationship(reply: string) {
  return /\b(friend|friends|lonely|relationship|group chat|social|family|parent|crush)\b/i.test(reply);
}

function mentionsPurpose(reply: string) {
  return /\b(purpose|meaning|future|identity|becoming|confidence|discipline)\b/i.test(reply);
}
