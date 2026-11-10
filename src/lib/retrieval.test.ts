import { describe, expect, it } from "vitest";

import { kbPassages } from "./kb";
import { searchKb, tokenize } from "./retrieval";

describe("searchKb", () => {
  it("finds the CSV export passage for exporting clients", () => {
    const results = searchKb("How do I export my clients?", kbPassages);
    expect(results[0].passage.id).toBe("export-clients-csv");
  });

  it("finds the password reset passage for a forgotten password", () => {
    const results = searchKb("I forgot my password", kbPassages);
    expect(results[0].passage.id).toBe("forgot-password");
  });

  it("finds the free plan limits for a limits question", () => {
    const results = searchKb("What is the free plan limit?", kbPassages);
    expect(results[0].passage.id).toBe("free-plan-limits");
  });

  it("finds the pricing passage for paying for Pro", () => {
    const results = searchKb("Can I pay for Pro yet?", kbPassages);
    expect(results[0].passage.id).toBe("pro-business-pricing");
  });

  it("finds the account deletion passage for deleting an account", () => {
    const results = searchKb("How do I delete my account?", kbPassages);
    expect(results[0].passage.id).toBe("export-delete-data");
  });

  it("finds the partial payment passage for a partial payment", () => {
    const results = searchKb("Can I record a partial payment?", kbPassages);
    expect(results[0].passage.id).toBe("record-payment");
  });

  it("finds the how-to-use passage for a general use question", () => {
    const results = searchKb("How do I use it?", kbPassages);
    expect(results[0].passage.id).toBe("how-to-use-clientdesk");
  });

  it("returns nothing for a question about something else entirely", () => {
    expect(searchKb("What is the weather today?", kbPassages)).toEqual([]);
    expect(searchKb("Tell me a joke", kbPassages)).toEqual([]);
  });

  it("returns nothing for an empty question", () => {
    expect(searchKb("", kbPassages)).toEqual([]);
    expect(searchKb("   ", kbPassages)).toEqual([]);
  });

  it("matches regardless of case", () => {
    const lower = searchKb("how do i export my clients?", kbPassages);
    const upper = searchKb("HOW DO I EXPORT MY CLIENTS?", kbPassages);
    expect(upper[0].passage.id).toBe(lower[0].passage.id);
  });

  it("returns at most the requested number of results", () => {
    expect(searchKb("invoice", kbPassages, 2)).toHaveLength(2);
  });
});

describe("tokenize", () => {
  it("lowercases and drops stopwords", () => {
    expect(tokenize("How do I export my clients?")).toEqual([
      "export",
      "clients",
    ]);
  });
});

describe("kbPassages", () => {
  it("every passage has a title, body, and source", () => {
    for (const passage of kbPassages) {
      expect(passage.title.length).toBeGreaterThan(0);
      expect(passage.body.length).toBeGreaterThan(0);
      // The source is shown to the user with the answer, so it must
      // never be empty.
      expect(passage.source.length).toBeGreaterThan(0);
    }
  });

  it("passage ids are unique", () => {
    const ids = kbPassages.map((passage) => passage.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
