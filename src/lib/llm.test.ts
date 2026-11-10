import { afterEach, describe, expect, it, vi, type Mock } from "vitest";

import { kbPassages } from "./kb";
import {
  answerQuestion,
  demoProvider,
  getProvider,
  groqProvider,
} from "./llm";

function mockGroqReply(content: string, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => ({
      choices: [{ message: { content } }],
    }),
  }) as Mock;
}

describe("demoProvider", () => {
  it("quotes the matching passage with its source", async () => {
    const answer = await demoProvider.generate(
      "How do I export my clients?",
      kbPassages,
    );
    expect(answer.matched).toBe(true);
    expect(answer.mode).toBe("demo");
    expect(answer.answer).toContain("export your clients as a CSV file");
    expect(answer.citations).toEqual(["ClientDesk clients page"]);
  });

  it("says it does not know when nothing matches", async () => {
    const answer = await demoProvider.generate(
      "What is the weather today?",
      kbPassages,
    );
    expect(answer.matched).toBe(false);
    expect(answer.answer).toContain("couldn't find an answer");
  });
});

describe("groqProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.GROQ_API_KEY;
    delete process.env.GROQ_MODEL;
  });

  it("throws without an API key", async () => {
    await expect(
      groqProvider.generate("What is the free plan limit?", kbPassages),
    ).rejects.toThrow("GROQ_API_KEY is not set");
  });

  it("asks Groq with the passages as context and the question", async () => {
    process.env.GROQ_API_KEY = "test-key";
    const fetchMock = mockGroqReply(
      "The Free plan allows 10 clients and 30 invoices.\nSources: ClientDesk pricing page",
    );
    vi.stubGlobal("fetch", fetchMock);

    const passages = kbPassages.filter((p) => p.id === "free-plan-limits");
    const answer = await groqProvider.generate(
      "What is the free plan limit?",
      passages,
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0] as [
      string,
      { headers: Record<string, string>; body: string },
    ];
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(options.headers.Authorization).toBe("Bearer test-key");
    const body = JSON.parse(options.body) as {
      model: string;
      messages: { role: string; content: string }[];
    };
    expect(body.model).toBe("qwen/qwen3.8-27b");
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[0].content).toContain("10 clients and 30 invoices");
    expect(body.messages[1]).toEqual({
      role: "user",
      content: "What is the free plan limit?",
    });

    expect(answer.mode).toBe("live");
    expect(answer.matched).toBe(true);
    expect(answer.citations).toEqual(["ClientDesk pricing page"]);
  });

  it("drops a source the model names that was not in the passages", async () => {
    process.env.GROQ_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      mockGroqReply(
        "The answer is in the docs.\nSources: ClientDesk pricing page, ClientDesk secret docs",
      ),
    );

    const passages = kbPassages.filter((p) => p.id === "free-plan-limits");
    const answer = await groqProvider.generate(
      "What is the free plan limit?",
      passages,
    );
    expect(answer.citations).toEqual(["ClientDesk pricing page"]);
  });

  it("throws when Groq answers with an error status", async () => {
    process.env.GROQ_API_KEY = "test-key";
    const fetchMock = mockGroqReply("", false, 401);
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      groqProvider.generate("What is the free plan limit?", kbPassages),
    ).rejects.toThrow("Groq API returned 401");
    // The failed call was retried once before giving up.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries once after a fast failure and answers live", async () => {
    process.env.GROQ_API_KEY = "test-key";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content:
                  "The Free plan allows 10 clients and 30 invoices.\nSources: ClientDesk pricing page",
              },
            },
          ],
        }),
      }) as Mock;
    vi.stubGlobal("fetch", fetchMock);

    const answer = await groqProvider.generate(
      "What is the free plan limit?",
      kbPassages,
    );
    expect(answer.mode).toBe("live");
    expect(answer.answer).toContain("10 clients and 30 invoices");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not call the model when no passage matched", async () => {
    process.env.GROQ_API_KEY = "test-key";
    const fetchMock = mockGroqReply("anything");
    vi.stubGlobal("fetch", fetchMock);

    const answer = await groqProvider.generate(
      "What is the weather today?",
      [],
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(answer.matched).toBe(false);
    expect(answer.answer).toContain("couldn't find an answer");
  });
});

describe("getProvider", () => {
  afterEach(() => {
    delete process.env.GROQ_API_KEY;
  });

  it("picks demo without a key and Groq with one", () => {
    delete process.env.GROQ_API_KEY;
    expect(getProvider().name).toBe("demo");

    process.env.GROQ_API_KEY = "test-key";
    expect(getProvider().name).toBe("groq");
  });
});

describe("answerQuestion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.GROQ_API_KEY;
  });

  it("answers in demo mode without a key", async () => {
    delete process.env.GROQ_API_KEY;
    const answer = await answerQuestion("How do I export my clients?");
    expect(answer.mode).toBe("demo");
    expect(answer.answer).toContain("export your clients as a CSV file");
  });

  it("answers live with a key, and falls back to demo when Groq fails", async () => {
    process.env.GROQ_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      mockGroqReply(
        "The Free plan allows 10 clients and 30 invoices.\nSources: ClientDesk pricing page",
      ),
    );
    const live = await answerQuestion("What is the free plan limit?");
    expect(live.mode).toBe("live");

    vi.stubGlobal("fetch", mockGroqReply("", false, 500));
    const fallback = await answerQuestion("What is the free plan limit?");
    expect(fallback.mode).toBe("demo");
    expect(fallback.answer).toContain("10 clients and 30 invoices");
  });
});
