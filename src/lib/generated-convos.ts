// Throwaway conversations created by sub-system generation.
//
// Sub-system generation calls /api/kai/chat (the only general-completion
// endpoint), which PERSISTS the turn to a conversation even with
// conversationId=null. The staging worker persists asynchronously, so the
// best-effort server delete 404s (the row isn't committed yet). To keep the
// generation prompt + raw JSON out of the user's chat, we record those
// conversation ids here and hide them client-side (main thread + history list).
// Device-local; fine for the prototype.

const KEY = "kai_gen_convos_v1";

function read(): string[] {
  try {
    if (typeof localStorage === "undefined") return [];
    const raw = localStorage.getItem(KEY);
    const arr: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? (arr.filter((x) => typeof x === "string") as string[]) : [];
  } catch {
    return [];
  }
}

export function markGeneratedConversation(id: string | null | undefined): void {
  if (!id || typeof localStorage === "undefined") return;
  try {
    const ids = read();
    if (ids.includes(id)) return;
    localStorage.setItem(KEY, JSON.stringify([...ids, id].slice(-50)));
  } catch {
    /* ignore */
  }
}

export function isGeneratedConversation(id: string | null | undefined): boolean {
  return !!id && read().includes(id);
}
