import { describe, expect, it } from "vitest";
import { fastKaiReply, fastPhysicalReply } from "../src/routes/chat";

describe("fastKaiReply", () => {
  it("answers simple greetings immediately with useful options", () => {
    const reply = fastKaiReply("whats up Kai");

    expect(reply).toContain("I’m here");
    expect(reply).toContain("What’s the vibe today");
    expect(reply).not.toContain("I can help with that");
    expect(reply).not.toMatch(/philosophy lens|purpose lens|next move/);
  });

  it("answers low motivation without waiting for the model", () => {
    const reply = fastKaiReply("I feel unmotivated");

    expect(reply).toContain("stuck feeling is real");
    expect(reply).toContain("10-minute start");
    expect(reply).not.toMatch(/philosophy lens|purpose lens/);
  });

  it("answers social rejection like a coach instead of a generic fallback", () => {
    const reply = fastKaiReply("my crush left me on delivered");

    expect(reply).toContain("actually hurts");
    expect(reply).not.toContain("I can help with that");
  });

  it("answers school focus pressure with a concrete short block", () => {
    const reply = fastKaiReply("i have a huge test tomorrow and i cant focus");

    expect(reply).toContain("12 minutes");
    expect(reply).not.toContain("I can help with that");
  });

  it("answers doomscrolling without a model wait", () => {
    const reply = fastKaiReply("i wasted 5 hours on tiktok and feel cooked");

    expect(reply).toContain("phone won");
    expect(reply).toContain("15 minutes");
  });

  it("answers teen slang overwhelm without falling to generic backup", () => {
    const reply = fastKaiReply("bro i am cooked what do i do");

    expect(reply).toContain("overloaded");
    expect(reply).toContain("reset");
    expect(reply).not.toContain("I can help with that");
  });

  it("answers missed-day shame with a reset instead of backup copy", () => {
    const reply = fastKaiReply("i skipped everything today and feel like i already failed");

    expect(reply).toContain("bad day");
    expect(reply).toContain("small save");
  });

  it("answers gym anxiety with a first-trip script", () => {
    const reply = fastKaiReply("i want to go to the gym but i feel embarrassed and dont know what to do");

    expect(reply).toContain("gym feels");
    expect(reply).toContain("walk in");
  });

  it("reframes wanting a girlfriend into healthy relationship reps", () => {
    const reply = fastKaiReply("i want a girlfriend but i have no confidence talking to girls");

    expect(reply).toContain("connection");
    expect(reply).toContain("Don’t turn it into");
    expect(reply).toContain("social rep");
    expect(reply).not.toMatch(/get a girl/i);
  });

  it("answers social-life asks with specific small reps", () => {
    const reply = fastKaiReply("i need a better social life and conversation skills");

    expect(reply).toContain("buildable");
    expect(reply).toContain("three small reps");
    expect(reply).toContain("follow-up question");
  });

  it("answers hungry lunch typos with food options", () => {
    const reply = fastKaiReply("im hungry what should i make for lunc");

    expect(reply).toContain("Make lunch simple");
    expect(reply).toContain("protein");
    expect(reply).toContain("What do you actually have");
    expect(reply).not.toContain("real thing underneath");
  });

  it("answers apology repair with a usable script", () => {
    const reply = fastKaiReply("i need to apologize to my friend but i dont know what to say");

    expect(reply).toContain("Keep it short");
    expect(reply).toContain("I’m sorry");
  });

  it("answers messy room overwhelm with a tiny timer", () => {
    const reply = fastKaiReply("my room is so messy and cleaning it feels overwhelming");

    expect(reply).toContain("7-minute timer");
    expect(reply).toContain("trash or laundry");
  });
});

describe("fastPhysicalReply", () => {
  it("answers basketball consistency asks with a specific workout", () => {
    const reply = fastPhysicalReply("i want to get better at basketball but i keep skipping workouts");

    expect(reply).toContain("20 minutes");
    expect(reply).toContain("handles");
    expect(reply).not.toContain("I can help with that");
  });

  it("answers safe muscle-building meal plan asks without calorie targets", () => {
    const reply = fastPhysicalReply("create a diet for bulking by this summer");

    expect(reply).toContain("muscle-building");
    expect(reply).toContain("School-day template");
    expect(reply).toContain("pre-workout");
    expect(reply).toContain("3-4 days");
    expect(reply).toContain("equipment");
    expect(reply).toContain("protein");
    expect(reply).not.toMatch(/\b\d+\s*(calorie|calories|pounds|lbs)\b/i);
    expect(reply).not.toMatch(/\btarget weight|weigh in|weigh-in|scale number\b/i);
  });

  it("answers getting cut from a team without generic shame language", () => {
    const reply = fastPhysicalReply("i got cut from the team and i feel embarrassed");

    expect(reply).toContain("full story");
    expect(reply).toContain("14 days");
  });

  it("answers pre-practice food timing", () => {
    const reply = fastPhysicalReply("what should i eat before practice later");

    expect(reply).toContain("carbs");
    expect(reply).toContain("water");
  });

  it("does not fast-path unrelated physical questions", () => {
    expect(fastPhysicalReply("my shoulder feels tight")).toBeNull();
  });
});
