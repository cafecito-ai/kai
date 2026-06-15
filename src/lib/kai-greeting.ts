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

/** Pick a random element. Called once per Home mount (the greeting is
 *  memoized on the display name), so the line is stable while you're on the
 *  page but varies each time you open the app. */
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

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
      const h = Math.round(hours);
      if (hours >= 8) {
        return pick([
          { line: hey(name, `${h} hours? That's the good stuff.`), replyChip: "Feels good" },
          { line: hey(name, `Solid ${h} hours, I can tell. Let's go.`), replyChip: "Yeah, I feel it" },
          { line: hey(name, `Nice, ${h} hours. You showed up for yourself.`), replyChip: "Felt great" },
        ]);
      }
      if (hours < 6) {
        return pick([
          { line: hey(name, "Rough night? Go easy on yourself today."), replyChip: "Yeah I'm beat" },
          { line: hey(name, "Short night. We'll take it slow, no pressure."), replyChip: "Appreciate that" },
        ]);
      }
    }
  }

  // 2) Hydration trailing the goal late in the day.
  if (period === "evening" || period === "afternoon") {
    const hyd = getTodayHydration(now);
    if (hyd.glasses < Math.max(1, Math.floor(hyd.target * 0.4))) {
      return pick([
        { line: hey(name, "Grab some water when you can? Then come find me."), replyChip: "On it" },
        { line: hey(name, "Sip some water for me, then let's talk."), replyChip: "Got it" },
      ]);
    }
  }

  // 3) Last check-in mood was rough.
  const checkInLogs = inputs.filter((i) => i.source === "check_in");
  const lastCheckIn = checkInLogs.length > 0 ? checkInLogs[checkInLogs.length - 1] : undefined;
  if (lastCheckIn) {
    const mood = (lastCheckIn.value as { mood?: number })?.mood;
    if (typeof mood === "number" && mood <= 2 && lastCheckIn.date === today) {
      return pick([
        { line: hey(name, "Earlier felt heavy. I'm right here."), replyChip: "Tell me what's up" },
        { line: hey(name, "Still thinking about earlier? Let's talk it out."), replyChip: "Yeah, let's talk" },
      ]);
    }
  }

  // 4) Already checked in today — glad you're back.
  if (todayInputs.some((i) => i.source === "check_in")) {
    return pick([
      { line: hey(name, "Good to see you again. What's up?"), replyChip: "Just checking in" },
      { line: hey(name, "Back already? I'm glad. What's on your mind?"), replyChip: "Just saying hi" },
      { line: hey(name, "Twice in one day? I'm here for it."), replyChip: "Couldn't stay away" },
    ]);
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
    return pick([
      { line: hey(name, `${streak} days straight. You're really showing up.`), replyChip: "Feels good" },
      { line: hey(name, `${streak} days deep. Proud of you.`), replyChip: "Thanks" },
    ]);
  }
  if (streak === 0 && inputs.length > 5) {
    return pick([
      { line: hey(name, "Been a minute! Good to have you back."), replyChip: "Yeah, I'm back" },
      { line: hey(name, "There you are. Missed you. What's new?"), replyChip: "Catch me up" },
    ]);
  }

  // 6) Fall through to a warm time-of-day greeting.
  return timeOfDayGreeting(period, name);
}

/** Warm name prefix: "Hey Evan, ..." (no name → just the line). */
function hey(name: string | null, rest: string): string {
  return name ? `Hey ${name}, ${lower(rest)}` : capitalize(rest);
}

function lower(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function timeOfDayGreeting(
  period: "morning" | "afternoon" | "evening" | "late",
  name: string | null,
): KaiGreeting {
  const n = name ? ` ${name}` : "";
  switch (period) {
    case "morning":
      return pick([
        { line: `Morning${n}! 👋 How'd you sleep?`, replyChip: "Pretty good" },
        { line: `Hey${n}, new day 👋 How you feeling?`, replyChip: "Feeling alright" },
        { line: `Morning${n}. Glad you're here.`, replyChip: "Glad to be" },
      ]);
    case "afternoon":
      return pick([
        { line: `Hey${n}! 👋 How's the day treating you?`, replyChip: "Going alright" },
        { line: `Good to see you${n} 👋 How's it going?`, replyChip: "Not bad" },
        { line: `Afternoon${n}. What's the vibe?`, replyChip: "Pretty chill" },
      ]);
    case "evening":
      return pick([
        { line: `Hey${n}! 👋 How'd today land?`, replyChip: "Mixed bag" },
        { line: `Made it to evening${n} 👋 How was it?`, replyChip: "Long day" },
        { line: `Evening${n}. How you doing?`, replyChip: "Hanging in" },
      ]);
    case "late":
      return pick([
        { line: `Hey${n} 👋 Still up? I'm here if your brain's busy.`, replyChip: "Yeah, kinda" },
        { line: `Late one${n}? Talk to me.`, replyChip: "Can't sleep" },
      ]);
  }
}
