import type { ChatMessage, DemoFeedbackChoices, DemoFoodPhotoResult, EngineEntry, EngineId, FoodPhotoResult, Goal, KaiTone, ProgressEvent, UserProfile } from "./types";

const STAGING_API_BASE = "https://kai-staging.evan-ratner.workers.dev";
const PRODUCTION_API_BASE = "https://kai.boostaisearch.ai";
const PUBLIC_DEMO_API_PATHS = new Set([
  "/api/demo-kai",
  "/api/demo-food-photo",
  "/api/demo-food-photo-upload",
  "/api/demo-session",
  "/api/scope-feedback",
  "/api/demo-feedback"
]);
type TokenGetter = () => Promise<string | null>;

let apiAuthTokenGetter: TokenGetter | null = null;

export function setApiAuthTokenGetter(getter: TokenGetter | null) {
  apiAuthTokenGetter = getter;
}

function getApiBaseUrl(path: string) {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");
  if (typeof window === "undefined") return "";
  if (window.location.hostname === "kai.boostaisearch.ai") return "";
  if (PUBLIC_DEMO_API_PATHS.has(path)) return PRODUCTION_API_BASE;
  return STAGING_API_BASE;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiBaseUrl(path)}${path}`;
  const token = await apiAuthTokenGetter?.();
  const devUser = getDevUser();
  const isFormData = init?.body instanceof FormData;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "content-type": "application/json" }),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(!token && devUser ? { "x-dev-user": devUser } : {}),
      ...init?.headers
    }
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

function getDevUser() {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname;
  const authRequired = import.meta.env.VITE_AUTH_REQUIRED === "1";
  // Public *.pages.dev preview URLs are shareable, and non-production hosts
  // route to the staging worker — so an open `.pages.dev` rule let anyone mint
  // an x-dev-user and write to staging unauthenticated. Gate previews behind an
  // explicit build-time opt-in (VITE_ALLOW_DEV_USER=1) instead.
  const devUserOptIn = import.meta.env.VITE_ALLOW_DEV_USER === "1";
  const canUseDevUser =
    host === "localhost" ||
    host === "127.0.0.1" ||
    (host.endsWith(".pages.dev") && devUserOptIn) ||
    (host === "kai.boostaisearch.ai" && !authRequired);
  if (!canUseDevUser) return null;
  // If the user has an existing dev-user id, reuse it (so reopening the
  // app in the same browser preserves their data).
  const stored = localStorage.getItem("kai.devUser");
  if (stored) return stored;
  // Fresh browser session (private window, cleared storage, etc) — mint
  // a random tester id so the backend treats them as a brand new user.
  // Previously we defaulted to "demo-teen" which meant every Private
  // Browsing window inherited the same pre-onboarded account, making it
  // impossible to test the new-user flow without manual localStorage tweaks.
  const fresh = `tester-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  try {
    localStorage.setItem("kai.devUser", fresh);
  } catch {
    /* Private mode quota — that's fine, we still return the id; it just
       won't persist beyond this page load. */
  }
  return fresh;
}

export const api = {
  getUser: () =>
    request<{ user: unknown; intake: unknown } & UserProfile>("/api/user/me"),
  chat: (engine: EngineId | "kai", message: string, conversationId?: string | null, clientContext?: unknown) =>
    request<{
      conversationId: string;
      reply: string;
      safetyEvent?: unknown;
      scheduleUpdate?: {
        action: "add" | "replace" | "remove";
        items: Array<{ section?: string; title: string; detail?: string; days: number[]; time: string | null }>;
        removeQuery?: string;
        summary: string;
      };
    }>(engine === "kai" ? "/api/kai/chat" : `/api/engines/${engine}/chat`, {
      method: "POST",
      // clientContext (Rawz/8 — KAI memory): a roll-up of the user's
      // recent activity so KAI can speak to what they've been DOING.
      // Built fresh in Chat.tsx via buildKaiClientContext() before each
      // turn so the model always sees current data. Capped to ~2KB.
      body: JSON.stringify({ conversationId, message, clientContext })
    }),
  getCurrentConversation: (engine: EngineId | "kai" = "kai") =>
    request<{ conversationId: string | null; messages: ChatMessage[] }>(`/api/conversations/current?engine=${engine}`),
  // North Star: 3 concrete today-doable moves toward a specific long-term goal.
  northStarMoves: (goal: string) =>
    request<{ moves: string[] }>("/api/north-star/moves", {
      method: "POST",
      body: JSON.stringify({ goal }),
    }),
  // Schedule/system: turn the goal (+ optional free-text) into a full lifestyle
  // system — daily habits, workouts, sleep, routines, mindset, things to avoid.
  scheduleGenerate: (req: string, goal?: string) =>
    request<{
      items: Array<{ section: string; title: string; detail?: string; days: number[]; time: string | null }>;
    }>("/api/schedule/generate", { method: "POST", body: JSON.stringify({ request: req, goal }) }),
  getDailyScoreToday: () =>
    request<{
      date: string;
      score: {
        userId: string;
        date: string;
        mental: number | null;
        sleep: number | null;
        mood: number | null;
        final: number | null;
        band: "low" | "mid" | "high" | null;
        updatedAt: string;
      };
      inputs: Array<{
        id: string;
        userId: string;
        date: string;
        source: string;
        value: unknown;
        createdAt: string;
      }>;
      suggestions: string[];
    }>("/api/score/today"),
  recordScoreInput: (body: {
    source: string;
    value: unknown;
    date?: string;
  }) =>
    request<{ inputId: string; score: unknown }>("/api/score/input", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getRecentScoreInput: () =>
    request<{
      input: {
        id: string;
        date: string;
        source: string;
        value: unknown;
        createdAt: string;
      } | null;
    }>("/api/score/recent-input"),
  submitCheckIn: (body: { mood: number; mind?: string; better?: string }) =>
    request<{
      score: unknown;
      reflection: string;
      window: "morning" | "evening" | "other";
      duplicateInWindow: boolean;
      safetyEvent?: unknown;
    }>("/api/check-in", { method: "POST", body: JSON.stringify(body) }),
  submitJournal: (body: { content: string }) =>
    request<{
      score: unknown;
      reflection: string;
      sentiment: number;
      safetyEvent?: unknown;
    }>("/api/journal", { method: "POST", body: JSON.stringify(body) }),
  submitSleep: (body: { hours: number; quality?: number; notes?: string }) =>
    request<{
      score: unknown;
      reflection: string;
      /** T-024 — Body recovery comment, present when recent workout context
       *  or notes suggest physical framing is more useful than reflective. */
      bodyComment?: string;
      safetyFlagged?: boolean;
    }>("/api/sleep", { method: "POST", body: JSON.stringify(body) }),
  // T-023 — workout logging.
  logWorkout: (body: {
    type: "run" | "strength" | "yoga" | "sport" | "other";
    durationMin: number;
    intensity: 1 | 2 | 3 | 4 | 5;
    notes?: string;
  }) =>
    request<{
      workoutId: string;
      bodyComment: string;
      score: unknown;
    }>("/api/workouts/log", { method: "POST", body: JSON.stringify(body) }),
  // T-030 — Body scan vision analyze.
  // Sends three decrypted image blobs to the Worker. Returns parsed
  // observations or a structured error message (filter_failed → user
  // retakes with the canned guidance).
  analyzeScan: (body: {
    sessionId: string;
    front: Blob;
    side: Blob;
    back: Blob;
  }) => {
    const form = new FormData();
    form.set("sessionId", body.sessionId);
    form.set("front", new File([body.front], "front.jpg", { type: body.front.type || "image/jpeg" }));
    form.set("side", new File([body.side], "side.jpg", { type: body.side.type || "image/jpeg" }));
    form.set("back", new File([body.back], "back.jpg", { type: body.back.type || "image/jpeg" }));
    return request<
      | {
          ok: true;
          observations: Array<{ index: 1 | 2 | 3; text: string; action: string }>;
          summary: string;
          attempts: number;
        }
      | {
          ok: false;
          reason: string;
          message: string;
          attempts: number;
        }
    >("/api/scan/analyze", {
      method: "POST",
      body: form,
    });
  },
  getScanObservations: (limit = 10) =>
    request<{
      observations: Array<{
        id: string;
        sessionId: string;
        observations: Array<{ index: 1 | 2 | 3; text: string; action: string }>;
        summary: string;
        attempts: number;
        createdAt: string;
      }>;
    }>(`/api/scan/observations?limit=${limit}`),
  getScanObservation: (sessionId: string) =>
    request<{
      observation: {
        id: string;
        sessionId: string;
        observations: Array<{ index: 1 | 2 | 3; text: string; action: string }>;
        summary: string;
        attempts: number;
        createdAt: string;
      } | null;
    }>(`/api/scan/observations/${sessionId}`),
  deleteScanObservation: (sessionId: string) =>
    request<{ ok: boolean }>(`/api/scan/observations/${sessionId}`, {
      method: "DELETE",
    }),
  // Phase G — Groups (T-036 → T-040)
  listGroups: () =>
    request<{
      groups: Array<{
        id: string;
        name: string;
        inviteCode: string;
        inviteExpires: string;
        inviteExpired: boolean;
        hideScore: boolean;
        leaderboardOptIn: boolean;
        joinedAt: string;
        memberCount: number;
      }>;
    }>(`/api/groups`),
  createGroup: (name: string) =>
    request<{
      group: { id: string; name: string; inviteCode: string; inviteExpires: string };
    }>(`/api/groups`, { method: "POST", body: JSON.stringify({ name }) }),
  joinGroup: (inviteCode: string) =>
    request<{ group: { id: string; name: string } }>(
      `/api/groups/join/${inviteCode}`,
      { method: "POST", body: "{}" },
    ),
  getGroup: (id: string) =>
    request<{
      group: {
        id: string;
        name: string;
        inviteCode: string;
        inviteExpires: string;
        inviteExpired: boolean;
        createdByMe: boolean;
      };
      me: { hideScore: boolean; leaderboardOptIn: boolean };
      members: Array<{
        userId: string;
        displayName: string;
        bucket: "high" | "mid" | "low" | "hidden" | "none";
        isMe: boolean;
        leaderboardOptIn: boolean;
      }>;
    }>(`/api/groups/${id}`),
  updateGroupMembership: (
    id: string,
    body: { hideScore?: boolean; leaderboardOptIn?: boolean },
  ) =>
    request<{ ok: true }>(`/api/groups/${id}/me`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  getEncouragementTemplates: () =>
    request<{
      templates: Array<{
        id: string;
        text: string;
        fitsContexts: string[];
      }>;
    }>(`/api/groups/templates`),
  sendEncouragement: (
    groupId: string,
    body: { toUserId: string; templateId?: string; customText?: string },
  ) =>
    request<{ message: { id: string; text: string } }>(
      `/api/groups/${groupId}/encourage`,
      { method: "POST", body: JSON.stringify(body) },
    ),
  getEncouragementInbox: () =>
    request<{
      messages: Array<{
        id: string;
        groupId: string;
        groupName: string;
        fromUserId: string;
        fromDisplayName: string;
        text: string;
        // 'encouragement' = teen-to-teen sent message; 'system' = auto-generated
        // (currently: Rawz/7 reaction notifications like "Lev reacted 🔥 to ...")
        kind: "encouragement" | "system";
        acked: boolean;
        createdAt: string;
      }>;
    }>(`/api/groups/inbox`),
  ackEncouragement: (id: string) =>
    request<{ ok: true }>(`/api/groups/messages/${id}/ack`, {
      method: "POST",
      body: "{}",
    }),
  // Rawz/7 — group activity feed + emoji reactions.
  // Fan-out is fire-and-forget: frontend calls this whenever it detects a
  // badge/level-up/streak crossing; server writes one row per group the
  // caller belongs to. UNIQUE constraint dedupes safely.
  postGroupActivity: (body: {
    kind: "badge" | "level_up" | "streak" | "goal_completed";
    refKey: string;
    hint?: string;
  }) =>
    request<{ ok: true; fannedOutTo: number }>(`/api/groups/activity`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getGroupActivity: (groupId: string) =>
    request<{
      activity: Array<{
        id: string;
        actorUserId: string;
        actorDisplayName: string;
        isMe: boolean;
        kind: "badge" | "level_up" | "streak" | "goal_completed";
        label: string;
        refKey: string;
        createdAt: string;
        reactions: Partial<Record<"🔥" | "💪" | "👏" | "🎯", number>>;
        myReactions: Array<"🔥" | "💪" | "👏" | "🎯">;
      }>;
      allowedReactions: ReadonlyArray<"🔥" | "💪" | "👏" | "🎯">;
    }>(`/api/groups/${groupId}/activity`),
  toggleGroupActivityReaction: (
    activityId: string,
    reaction: "🔥" | "💪" | "👏" | "🎯",
  ) =>
    request<{ ok: true; added: boolean }>(
      `/api/groups/activity/${activityId}/react`,
      { method: "POST", body: JSON.stringify({ reaction }) },
    ),
  getGroupLeaderboard: (id: string) =>
    request<{
      entries: Array<{
        userId: string;
        displayName: string;
        bucket: "high" | "mid" | "low" | "hidden" | "none";
        streakDays: number;
      }>;
    }>(`/api/groups/${id}/leaderboard`),
  blockGroupMember: (groupId: string, targetUserId: string) =>
    request<{ ok: true }>(`/api/groups/${groupId}/block/${targetUserId}`, {
      method: "POST",
      body: "{}",
    }),
  leaveGroup: (id: string) =>
    request<{ ok: true }>(`/api/groups/${id}/leave`, {
      method: "POST",
      body: "{}",
    }),
  reportGroup: (
    id: string,
    body: { targetUserId?: string; context: string },
  ) =>
    request<{ ok: true }>(`/api/groups/${id}/report`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  // T-035 — voice eligibility + session control
  getVoiceEligibility: (localHour: number) =>
    request<
      | { allowed: true }
      | { allowed: false; reason: string; message: string }
    >(`/api/voice/eligibility?localHour=${localHour}`),
  startVoiceCall: (body: { toNumber: string; localHour: number }) =>
    request<{ callId: string; status: string }>(`/api/voice/start`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getRecentVoiceSessions: (limit = 10) =>
    request<{
      sessions: Array<{
        id: string;
        agent: string | null;
        startedAt: string;
        endedAt: string | null;
        durationSec: number | null;
        safetyFlagged: boolean;
      }>;
    }>(`/api/voice/recent?limit=${limit}`),
  getRecentWorkouts: (limit = 10) =>
    request<{
      workouts: Array<{
        id: string;
        date: string;
        type: string;
        durationMin: number;
        intensity: number;
        notes: string | null;
        createdAt: string;
      }>;
    }>(`/api/workouts/recent?limit=${limit}`),
  updateUser: (body: { displayName?: string; kaiName?: string; kaiTone?: KaiTone; primaryEngine?: EngineId; age?: number; parentEmail?: string; onboardingCompleted?: boolean; designPreference?: string }) =>
    request("/api/user/me", { method: "PATCH", body: JSON.stringify(body) }),
  submitIntake: (responses: Record<string, string>) =>
    request<{ summary: string; suggestedEngine: EngineId; reasoning: string }>("/api/onboarding/intake", {
      method: "POST",
      body: JSON.stringify({ responses })
    }),
  logProgress: (body: Omit<ProgressEvent, "id" | "occurredAt">) =>
    request<{ event: ProgressEvent }>("/api/progress/event", { method: "POST", body: JSON.stringify(body) }),
  getProgress: () => request<{ eventsByDay: ProgressEvent[]; level: number; streaks: unknown; belts: unknown }>("/api/progress"),
  getGoals: () => request<{ goals: Goal[] }>("/api/goals"),
  createGoal: (goal: Omit<Goal, "id" | "status">) =>
    request<{ goal: Goal }>("/api/goals", { method: "POST", body: JSON.stringify(goal) }),
  updateGoal: (goalId: string, body: Partial<Goal>) =>
    request<{ goal: Goal }>(`/api/goals/${goalId}`, { method: "PATCH", body: JSON.stringify(body) }),
  getEngineEntries: (engine: EngineId) =>
    request<{ entries: EngineEntry[] }>(`/api/engines/${engine}/entries`),
  createEngineEntry: (engine: EngineId, body: { entryType: string; title?: string; payload?: unknown; completed?: boolean }) =>
    request<{ entry: EngineEntry }>(`/api/engines/${engine}/entries`, { method: "POST", body: JSON.stringify(body) }),
  analyzeFoodPhoto: (body: { r2Key?: string; note?: string }) =>
    request<FoodPhotoResult>("/api/food-photo", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  uploadFoodPhoto: (file: File, note?: string) => {
    const body = new FormData();
    body.set("photo", file);
    if (note?.trim()) body.set("note", note.trim());
    return request<FoodPhotoResult>("/api/food-photo-upload", {
      method: "POST",
      body
    });
  },
  sendParentConsent: (body: { parentEmail: string; teenName?: string }) =>
    request<{ ok: boolean; expiresAt: string; emailSent: boolean }>("/api/parent/consent/request", { method: "POST", body: JSON.stringify(body) }),
  getFriendCompare: () =>
    request<{
      friends: Array<{
        userId: string;
        displayName: string;
        level: number;
        streakOverall: number;
        totalScore: number;
      }>;
    }>("/api/friends/compare"),
  getDemoSessions: () =>
    request<{
      sessions: Array<{
        sessionId: string;
        reviewerName: string | null;
        reviewerEmail: string | null;
        kaiName: string | null;
        kaiTone: string | null;
        firstName: string | null;
        vibes: string[];
        tried: string[];
        lastAct: number;
        completedAt: string | null;
        createdAt: string;
        updatedAt: string;
      }>;
    }>("/api/ops/demo-sessions"),
  getDemoSession: (sessionId: string) =>
    request<{
      session: {
        sessionId: string;
        reviewerName: string | null;
        reviewerEmail: string | null;
        build: Record<string, unknown> | null;
        chat: Array<{ role: "user" | "assistant"; content: string }> | null;
        feelings: { transcript?: Array<{ role: "user" | "assistant"; content: string }>; summary?: string } | null;
        meal: Record<string, unknown> | null;
        tried: string[];
        lastAct: number;
        completedAt: string | null;
        userAgent: string | null;
        createdAt: string;
        updatedAt: string;
      };
    }>(`/api/ops/demo-sessions/${encodeURIComponent(sessionId)}`),
  getSafetyEvents: () =>
    request<{
      events: Array<{
        id: string;
        userId: string;
        category: string;
        severity: string;
        conversationId: string | null;
        messageId: string | null;
        resourcesShown: string[];
        parentNotified: boolean;
        reviewedByOps: boolean;
        createdAt: string;
      }>;
    }>("/api/ops/safety-events"),
  submitStrengthsDiscovery: (responses: Record<string, string>) =>
    request<{ summary: string; answered: number; total: number }>("/api/engines/potential/strengths", {
      method: "POST",
      body: JSON.stringify({ responses })
    }),
  submitDemoFeedback: (body: {
    sessionId: string;
    choices: DemoFeedbackChoices;
    summary: string;
    stepId?: string;
    stepIndex?: number;
    source?: "auto" | "manual";
  }) =>
    request<{ ok: boolean; id: string }>("/api/demo-feedback", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  saveDemoSession: (body: {
    sessionId: string;
    reviewerName?: string;
    reviewerEmail?: string;
    build: unknown;
    chat?: unknown;
    feelings?: unknown;
    meal?: unknown;
    tried: string[];
    lastAct: number;
    completed: boolean;
  }) =>
    request<{ ok: boolean; sessionId: string }>("/api/demo-session", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  submitScopeFeedback: (body: {
    sessionId: string;
    answers: Record<string, string>;
    completedMissions: number;
    summary: string;
  }) =>
    request<{ ok: boolean; id: string }>("/api/scope-feedback", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  demoFoodPhoto: (file: File, sessionId: string, note?: string) => {
    const body = new FormData();
    body.set("photo", file);
    body.set("sessionId", sessionId);
    if (note?.trim()) body.set("note", note.trim());
    return request<DemoFoodPhotoResult>("/api/demo-food-photo-upload", {
      method: "POST",
      body
    });
  },
  demoKai: (body: {
    message: string;
    history: { role: "user" | "assistant"; content: string }[];
    vibes: string[];
    kaiName: string;
    kaiTone: "warm" | "balanced" | "direct";
    firstName?: string;
    mode?: "chat" | "feelings";
  }) =>
    request<{ reply: string; capped?: boolean; turnsRemaining?: number; safetyEvent?: { category?: string; severity?: string } }>("/api/demo-kai", {
      method: "POST",
      body: JSON.stringify(body)
    })
};
