// Picks the warm, friend-y line KAI says when you land on Home.
//
// The goal: make you want to talk to KAI every time you open the app.
// KAI greets you by name, references something specific about your
// recent state (sleep, mood, streak) when there's signal, and keeps
// it short. Tone is best-friend, not therapist.

import { readLocalInputs } from "./local-score";
import { getTodayHydration } from "./local-hydration";

export type KaiGreeting = {
  /** The line KAI says next to their character. ≤ 80 chars. */
  line: string;
  /** A short suggested response chip — what tapping it sends to chat.
   *  Lets the user respond with one tap if they don't want to type. */
  replyChip: string;
};

/** Compose a contextual greeting. Pulls from local data so it works
 *  offline / before the API is wired. */
export function pickKaiGreeting(
  displayName: string | null,
  now: Date = new Date(),
): KaiGreeting {
  const inputs = readLocalInputs();
  const today = now.toISOString().slice(0, 10);
  const todayInputs = inputs.filter((i) => i.date === today);
  const hour = now.getHours();
  const name = displayName?.trim() || null;

  // Time-of-day flavour for the open. Used when we don't have a more
  // specific signal to lead with.
  const period: "morning" | "afternoon" | "evening" | "late" =
    hour < 5
      ? "late"
      : hour < 12
        ? "morning"
        : hour < 17
          ? "afternoon"
          : hour < 23
            ? "evening"
            : "late";

  // Look for specific signals — these "win" over the generic greeting.

  // 1) Recent sleep log (last 24h, even if it lives on yesterday's date).
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const ydayKey = yesterday.toISOString().slice(0, 10);
  const sleepLogs = inputs.filter(
    (i) => i.source === "sleep_log" && (i.date === today || i.date === ydayKey),
  );
  const lastSleep = sleepLogs.length > 0 ? sleepLogs[sleepLogs.length - 1] : undefined;
  if (lastSleep && period === "morning") {
    const hours = (lastSleep.value as { hours?: number })?.hours;
    if (typeof hours === "number") {
      if (hours >= 8) {
        return {
          line: nameLine(name, `Saw you got a solid ${Math.round(hours)} hours. Good move.`),
          replyChip: "Yeah, I feel it",
        };
      }
      if (hours < 6) {
        return {
          line: nameLine(name, "Rough night, huh? Be easy on yourself today."),
          replyChip: "Yeah I'm beat",
        };
      }
    }
  }

  // 2) Hydration trailing the goal late in the day.
  if (period === "evening" || period === "afternoon") {
    const hyd = getTodayHydration(now);
    if (hyd.glasses < Math.max(1, Math.floor(hyd.target * 0.4))) {
      return {
        line: nameLine(name, "Water count's low — grab one before we talk?"),
        replyChip: "On it",
      };
    }
  }

  // 3) Last check-in mood was rough.
  const checkInLogs = inputs.filter((i) => i.source === "check_in");
  const lastCheckIn = checkInLogs.length > 0 ? checkInLogs[checkInLogs.length - 1] : undefined;
  if (lastCheckIn) {
    const mood = (lastCheckIn.value as { mood?: number })?.mood;
    if (typeof mood === "number" && mood <= 2 && lastCheckIn.date === today) {
      return {
        line: nameLine(name, "Tough one earlier — I'm still here. Talk it out?"),
        replyChip: "Tell me what's up",
      };
    }
  }

  // 4) Already checked in today — proud of you.
  if (todayInputs.some((i) => i.source === "check_in")) {
    return {
      line: nameLine(name, "Good to see you back. What's on your mind?"),
      replyChip: "Just checking in",
    };
  }

  // 5) Streak: long streak — affirm. Just back from a break — welcome.
  const distinctDates = new Set(inputs.map((i) => i.date));
  let streak = 0;
  const d = new Date(now);
  for (let i = 0; i < 60; i += 1) {
    const key = d.toISOString().slice(0, 10);
    if (distinctDates.has(key)) streak += 1;
    else break;
    d.setDate(d.getDate() - 1);
  }
  if (streak >= 7) {
    return {
      line: nameLine(name, `${streak} days deep. You're showing up.`),
      replyChip: "Feels good",
    };
  }
  if (streak === 0 && inputs.length > 5) {
    return {
      line: nameLine(name, "Been a minute. Welcome back."),
      replyChip: "Yeah, I'm back",
    };
  }

  // 6) Fall through to time-of-day greeting.
  return {
    line: timeOfDayGreeting(period, name),
    replyChip: defaultReplyChip(period),
  };
}

function nameLine(name: string | null, rest: string): string {
  if (!name) return rest;
  // "Evan — saw you got a solid 8 hours..." reads warmer than
  // "Evan, saw you got..." (no comma). En-dash for a natural pause.
  return `${name} — ${rest}`;
}

function timeOfDayGreeting(
  period: "morning" | "afternoon" | "evening" | "late",
  name: string | null,
): string {
  switch (period) {
    case "morning":
      return name ? `Morning, ${name}. How'd you sleep?` : "Morning. How'd you sleep?";
    case "afternoon":
      return name ? `Hey ${name}. How's the day?` : "Hey. How's the day?";
    case "evening":
      return name ? `${name} — how'd today land?` : "How'd today land?";
    case "late":
      return name ? `${name} — still up? Brain busy?` : "Still up? Brain busy?";
  }
}

function defaultReplyChip(
  period: "morning" | "afternoon" | "evening" | "late",
): string {
  switch (period) {
    case "morning":
      return "Pretty good";
    case "afternoon":
      return "Going alright";
    case "evening":
      return "Mixed bag";
    case "late":
      return "Yeah, kinda";
  }
}
