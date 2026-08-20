import { describe, expect, test } from "vitest";

import { capitalizeSentences, summarizeIncident } from "./aiMock.js";

describe("capitalizeSentences", () => {
  test("capitalizes the first letter of every sentence", () => {
    expect(
      capitalizeSentences("my manager yelled at me. it happened at 3pm. i was scared.")
    ).toBe("My manager yelled at me. It happened at 3pm. I was scared.");
  });

  test("handles mixed casing and multiple spaces/newlines", () => {
    expect(
      capitalizeSentences("hE was RUDE to me!  then he walked away.\nno one else saw it.")
    ).toBe("HE was RUDE to me!  Then he walked away.\nNo one else saw it.");
  });

  test("leaves empty/falsy input unchanged", () => {
    expect(capitalizeSentences("")).toBe("");
    expect(capitalizeSentences(null)).toBe(null);
  });
});

describe("summarizeIncident", () => {
  test("capitalizes lowercase user messages in the report", async () => {
    const summary = await summarizeIncident([
      { role: "user", text: "my coworker kept interrupting me during the meeting." },
      { role: "user", text: "it happened again yesterday. i reported it to my manager." },
    ]);

    expect(summary).toMatch(/Overview\nMy coworker kept interrupting me during the meeting\./);
    expect(summary).not.toMatch(/\bmy coworker\b/);
  });
});
