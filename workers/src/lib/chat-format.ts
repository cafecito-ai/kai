type ReplyMode = "mind" | "body" | "general";

const MAX_PARAGRAPH_CHARS = 150;
const MAX_BODY_PARAGRAPHS = 3;

export function formatKaiReply(rawReply: string, mode: ReplyMode = "general") {
  const cleaned = rawReply
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!cleaned) return gentleFallback(mode);

  const paragraphs = cleaned
    .split(/\n{2,}/)
    .flatMap((paragraph) => splitLongParagraph(paragraph.trim()))
    .filter(Boolean);

  const body = limitQuestions(paragraphs.slice(0, MAX_BODY_PARAGRAPHS).join("\n\n"));
  if (hasNaturalQuestion(body) || hasEnoughSubstance(body)) return body;
  return `${body}\n\n${gentleFollowUp(body, mode)}`;
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

function hasNaturalQuestion(reply: string) {
  return /\?\s*$/.test(reply.trim());
}

function limitQuestions(reply: string) {
  const questionCount = (reply.match(/\?/g) ?? []).length;
  if (questionCount <= 1) return reply;

  let keptQuestion = false;
  return reply
    .split("\n\n")
    .map((paragraph) => {
      const sentences = paragraph.match(/[^.!?]+[.!?]+["')\]]?|[^.!?]+$/g) ?? [paragraph];
      const kept = sentences.filter((sentence) => {
        if (!sentence.includes("?")) return true;
        if (keptQuestion) return false;
        keptQuestion = true;
        return true;
      });
      return kept.join(" ").replace(/\s+/g, " ").trim();
    })
    .filter(Boolean)
    .join("\n\n");
}

function hasEnoughSubstance(reply: string) {
  const sentenceCount = reply.match(/[.!?](\s|$)/g)?.length ?? 0;
  return sentenceCount >= 2 || reply.length >= 140;
}

function gentleFallback(mode: ReplyMode) {
  if (mode === "body") return "I’m here. What are you trying to do with your body or energy today?";
  return "I’m here. What’s actually going on today?";
}

function gentleFollowUp(reply: string, mode: ReplyMode) {
  if (mode === "body") return "What are you trying to do today?";
  if (mentionsRelationship(reply)) return "What happened?";
  if (mentionsPurpose(reply)) return "What part of that feels hardest right now?";
  return "What’s the real thing underneath it?";
}

function mentionsRelationship(reply: string) {
  return /\b(friend|friends|lonely|relationship|group chat|social|family|parent|crush|people)\b/i.test(reply);
}

function mentionsPurpose(reply: string) {
  return /\b(purpose|meaning|future|identity|becoming|confidence|discipline|pressure|school)\b/i.test(reply);
}
