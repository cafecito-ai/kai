export type GrowthPlanSuggestion = {
  title: string;
  description: string;
  category: "growth";
  source: "chat" | "check_in";
};

type Source = GrowthPlanSuggestion["source"];

export function detectGrowthPlanSuggestion(message: string, source: Source): GrowthPlanSuggestion | null {
  const text = normalize(message);
  if (!text) return null;

  if (mentionsDating(text)) {
    return suggestion(
      "Build meaningful relationships",
      "Turn wanting connection into confidence, social reps, and healthier relationships.",
      source,
    );
  }

  if (mentionsFriendship(text)) {
    return suggestion(
      "Meet new people",
      "Practice small social reps so friendship feels less random and more buildable.",
      source,
    );
  }

  if (mentionsConfidence(text)) {
    return suggestion(
      "Improve confidence",
      "Build evidence through small actions instead of waiting to feel confident first.",
      source,
    );
  }

  if (mentionsSocialLife(text)) {
    return suggestion(
      "Strengthen social skills",
      "Practice becoming more outgoing, starting conversations, and showing up around people.",
      source,
    );
  }

  return null;
}

function suggestion(title: string, description: string, source: Source): GrowthPlanSuggestion {
  return { title, description, category: "growth", source };
}

function normalize(message: string) {
  return message
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function mentionsDating(text: string) {
  return (
    /\b(girlfriend|gf|girl friend|boyfriend|bf|relationship|date|dating|ask (a )?(girl|boy|someone|her|him|them) out|crush)\b/.test(text) &&
    /\b(want|wish|need|never had|can't get|cant get|how do i|get|find|meet|talk to|like me|confidence)\b/.test(text)
  );
}

function mentionsFriendship(text: string) {
  return (
    /\b(friends?|friend group|new people|people to hang|someone to hang|social circle)\b/.test(text) &&
    /\b(want|wish|need|more|make|meet|find|no|none|lonely|alone|left out)\b/.test(text)
  );
}

function mentionsConfidence(text: string) {
  return /\b(confiden(t|ce)|insecure|awkward|shy|embarrassed|self esteem|self-esteem|scared to talk|nervous to talk)\b/.test(text);
}

function mentionsSocialLife(text: string) {
  return /\b(social life|more outgoing|outgoing|social skills|talk to people|start conversations?|conversation skills|fit in|make plans)\b/.test(text);
}
