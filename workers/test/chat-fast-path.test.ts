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

  it("answers new-school friendship asks with repeatable places", () => {
    const reply = fastKaiReply("i just moved schools and i dont know how to make friends");

    expect(reply).toContain("New school");
    expect(reply).toContain("repeatable place");
    expect(reply).toContain("talking stops feeling random");
  });

  it("answers ask-out questions without pretending to have human experience", () => {
    const reply = fastKaiReply("how do i ask a girl out without making it weird");

    expect(reply).toContain("low-pressure");
    expect(reply).toContain("Want to hang out sometime");
    expect(reply).not.toMatch(/I've been|I have been|my experience/i);
  });

  it("answers party pressure with a boundary script", () => {
    const reply = fastKaiReply("my friends want me to go to a party but i dont drink and i feel lame");

    expect(reply).toContain("doesn’t make you lame");
    expect(reply).toContain("I’m good tonight");
    expect(reply).toContain("leave if the vibe");
  });

  it("answers photo anxiety with a posting boundary", () => {
    const reply = fastKaiReply("i hate how i look in photos and dont want anyone to post me");

    expect(reply).toContain("Don’t post that one");
    expect(reply).toContain("inspecting yourself");
  });

  it("answers pregame nerves with a performance routine", () => {
    const reply = fastKaiReply("i get nervous before games and play worse than practice");

    expect(reply).toContain("Pregame nerves");
    expect(reply).toContain("slow exhale");
    expect(reply).toContain("first useful rep");
  });

  it("answers college pressure with a concrete sorting exercise", () => {
    const reply = fastKaiReply("everyone keeps asking about college and i feel behind");

    expect(reply).toContain("College pressure");
    expect(reply).toContain("three columns");
    expect(reply).toContain("next honest option");
  });

  it("answers teacher conflict with facts and a repair move", () => {
    const reply = fastKaiReply("my teacher hates me and i feel like theres no point trying in that class");

    expect(reply).toContain("one adult’s vibe");
    expect(reply).toContain("facts from the story");
    expect(reply).toContain("repair move");
  });

  it("answers parent grade pressure without tying worth to grades", () => {
    const reply = fastKaiReply("my parents expect straight As and i feel like im never enough");

    expect(reply).toContain("love feel conditional");
    expect(reply).toContain("separate your worth");
    expect(reply).toContain("I’m working on a plan");
  });

  it("answers jealousy with admiration-to-rep framing", () => {
    const reply = fastKaiReply("my friend is better than me at everything and i hate that im jealous");

    expect(reply).toContain("Jealousy");
    expect(reply).toContain("exact thing you admire");
    expect(reply).toContain("one rep");
  });

  it("answers no-one-texts loneliness with a clean social test", () => {
    const reply = fastKaiReply("no one texts me first and it makes me feel unwanted");

    expect(reply).toContain("does hurt");
    expect(reply).toContain("one clean test");
    expect(reply).toContain("Their response gives you data");
  });

  it("answers screenshot drama with privacy triage", () => {
    const reply = fastKaiReply("someone screenshotted my snap and now people are talking");

    expect(reply).toContain("feels violating");
    expect(reply).toContain("Screenshot what happened");
    expect(reply).toContain("bring in an adult fast");
  });

  it("answers first job interview nerves with prep bullets in prose", () => {
    const reply = fastKaiReply("i have my first job interview and im nervous");

    expect(reply).toContain("three answers");
    expect(reply).toContain("10 minutes early");
    expect(reply).toContain("What would make someone good at this role");
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
    expect(reply).toContain("Training side");
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

  it("answers cheap school protein asks with specific foods", () => {
    const reply = fastPhysicalReply("what are cheap high protein foods i can bring to school");

    expect(reply).toContain("Greek yogurt");
    expect(reply).toContain("tuna packets");
    expect(reply).toContain("peanut butter sandwich");
    expect(reply).not.toContain("test stress");
  });

  it("answers coach bench anxiety with a script", () => {
    const reply = fastPhysicalReply("im scared to ask coach why im benched");

    expect(reply).toContain("what are one or two things");
    expect(reply).toContain("earn more minutes");
    expect(reply).toContain("check back");
  });

  it("does not fast-path unrelated physical questions", () => {
    expect(fastPhysicalReply("my shoulder feels tight")).toBeNull();
  });
});
