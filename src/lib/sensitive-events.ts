/**
 * Sensitive-event scrubber. Several primers (substances, trauma, body image,
 * sex education, online safety, grief, mental-health adjacent topics) cover
 * material a teen would reasonably not want associated with their account
 * identifier in the server-side analytics store.
 *
 * The original wiring sent `{ articleId: "sextortion-reality" }` (or similar)
 * to `progress_events.payload` for every primer-read event. This module
 * gives us a single place to:
 *
 *   1. List event types we consider sensitive.
 *   2. Return a payload safe to send to the server for those events.
 *
 * Non-sensitive events keep their full payload. Sensitive events drop the
 * specific identifier and keep only the high-level fact ("a primer was
 * read in this category"). This still lets us see surface engagement
 * without recording which articles a specific user opened.
 *
 * If we later want richer analytics for sensitive primers, the right path
 * is opt-in from the teen, not silent payload retention.
 */

/** Event types that should be scrubbed before going to the server. */
export const SENSITIVE_EVENT_TYPES = new Set<string>([
  "substances_primer_read",
  "trauma_primer_read",
  "sex_ed_primer_read",
  "body_image_primer_read",
  "online_safety_primer_read",
  "grief_primer_read",
  "mood_logged",
  "stress_primer_read",
  "relationships_primer_read",
  "identity_primer_read",
  "emotion_vocab_read",
  "screen_time_logged"
  // Cycle and hydration tracker logs are scoped to localStorage and do not
  // route through this scrubber. If they're ever routed through addEvent,
  // add them here too.
]);

/**
 * Returns a payload safe to send to the server for the given event type.
 *
 * For sensitive event types: drops everything except the engine field
 * (we still want to know which engine the surface lives on, but not which
 * specific article a teen opened).
 *
 * For non-sensitive event types: returns the payload unchanged.
 */
export function scrubPayload(
  eventType: string,
  payload: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!SENSITIVE_EVENT_TYPES.has(eventType)) return payload;
  if (!payload) return payload;
  const safe: Record<string, unknown> = {};
  if (typeof payload.engine === "string") safe.engine = payload.engine;
  return safe;
}

/**
 * Convenience wrapper that returns a scrubbed copy of a progress-event
 * input object. Use this when forwarding events from a primer's onRead
 * callback to the progress store / API client.
 */
export function scrubProgressEvent<
  T extends { eventType: string; payload?: Record<string, unknown> }
>(event: T): T {
  return { ...event, payload: scrubPayload(event.eventType, event.payload) };
}
