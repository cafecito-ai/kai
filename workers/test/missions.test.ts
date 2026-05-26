import { describe, expect, it } from "vitest";
import { parseMissionDrafts } from "../src/routes/missions";

const answers = {
  body: "sleep better before practice",
  mind: "pressure before tests",
  purpose: "make music that sounds like me",
  people: "I can be honest with my friends"
};

describe("parseMissionDrafts", () => {
  it("parses generated mission JSON into all four pillars", () => {
    const result = parseMissionDrafts(
      JSON.stringify({
        missions: {
          body: { statement: "I am building energy I can trust.", why: "Practice feels better when sleep is real." },
          mind: { statement: "I am learning to handle pressure without disappearing.", why: "Tests do not get to own the whole day." },
          purpose: { statement: "I am making music that sounds like me.", why: "That goal came from their own words." },
          people: { statement: "I am practicing friendships where honesty is allowed.", why: "They named honesty as the point." }
        }
      }),
      answers
    );

    expect(result).toHaveLength(4);
    expect(result[0]).toMatchObject({ pillar: "body", statement: "I am building energy I can trust." });
    expect(result[3]).toMatchObject({ pillar: "people" });
  });

  it("falls back safely on malformed model output", () => {
    const result = parseMissionDrafts("not-json", answers);

    expect(result).toHaveLength(4);
    expect(result[0].statement).toContain("sleep better before practice");
    expect(result[2].why).toContain("make music");
  });
});
