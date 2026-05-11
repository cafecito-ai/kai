import type { SafetyResult } from "./types";

const crisisPatterns = [
  { category: "suicide_ideation", severity: "critical" as const, pattern: /\b(kill myself|suicide|end my life|not want to live)\b/i },
  { category: "self_harm", severity: "high" as const, pattern: /\b(cut myself|self harm|hurt myself|burn myself)\b/i },
  { category: "eating_disorder", severity: "high" as const, pattern: /\b(purge|starve myself|throw up after eating)\b/i },
  { category: "abuse_disclosure", severity: "high" as const, pattern: /\b(abuse|molest|assaulted|hit me)\b/i },
  { category: "substance", severity: "high" as const, pattern: /\b(overdose|too many pills|drunk and driving)\b/i },
  { category: "violence_to_others", severity: "critical" as const, pattern: /\b(kill them|hurt someone|shoot|stab)\b/i }
];

export function localSafetyCheck(text: string): SafetyResult {
  const hit = crisisPatterns.find((item) => item.pattern.test(text));
  if (!hit) return { safe: true };
  return {
    safe: false,
    category: hit.category,
    severity: hit.severity,
    response:
      "Hey. I hear you. That's a lot. What you're carrying is bigger than what I can help with directly. If you're in immediate danger, call 911 now. In the U.S. or Canada, call or text 988. You can also text HOME to 741741 for Crisis Text Line. I can stay here while you reach out."
  };
}
