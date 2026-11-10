import { describe, expect, it } from "vitest";

import { respondToQuestion } from "./responder";

describe("respondToQuestion", () => {
  it("answers by quoting the matching passage, with its source", async () => {
    const answer = await respondToQuestion("How do I export my clients?");
    expect(answer.matched).toBe(true);
    expect(answer.mode).toBe("demo");
    expect(answer.answer).toContain("export your clients as a CSV file");
    expect(answer.citations).toEqual(["ClientDesk clients page"]);
  });

  it("tells the honest truth about password reset not working yet", async () => {
    const answer = await respondToQuestion("I forgot my password");
    expect(answer.matched).toBe(true);
    expect(answer.answer).toContain("not switched on yet");
  });

  it("says it does not know when nothing matches, instead of inventing", async () => {
    const answer = await respondToQuestion("What is the weather today?");
    expect(answer.matched).toBe(false);
    expect(answer.citations).toEqual([]);
    expect(answer.answer).toContain("couldn't find an answer");
  });
});
