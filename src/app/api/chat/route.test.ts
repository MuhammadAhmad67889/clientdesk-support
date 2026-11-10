import { describe, expect, it } from "vitest";

import { POST } from "./route";

function postQuestion(body: unknown) {
  return POST(
    new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/chat", () => {
  it("answers a real question from the knowledge base", async () => {
    const response = await postQuestion({
      question: "What is the free plan limit?",
    });
    expect(response.status).toBe(200);

    const data = (await response.json()) as {
      answer: string;
      citations: string[];
      matched: boolean;
      mode: string;
    };
    expect(data.matched).toBe(true);
    expect(data.mode).toBe("demo");
    expect(data.answer).toContain("10 clients and 30 invoices");
    expect(data.citations).toEqual(["ClientDesk pricing page"]);
  });

  it("answers honestly when nothing matches", async () => {
    const response = await postQuestion({
      question: "What is the weather today?",
    });
    expect(response.status).toBe(200);

    const data = (await response.json()) as {
      matched: boolean;
      answer: string;
    };
    expect(data.matched).toBe(false);
    expect(data.answer).toContain("couldn't find an answer");
  });

  it("rejects an empty question with 400", async () => {
    const response = await postQuestion({ question: "   " });
    expect(response.status).toBe(400);
  });

  it("rejects a missing question with 400", async () => {
    const response = await postQuestion({});
    expect(response.status).toBe(400);
  });

  it("rejects a body that is not valid JSON with 400", async () => {
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{not json",
      }),
    );
    expect(response.status).toBe(400);
  });
});
