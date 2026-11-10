import { describe, expect, it, vi } from "vitest";

// The database is mocked: the chat route is tested for its logic
// (validation, persistence calls, the fallback when storage fails),
// and the real database path runs in CI (postgres service).
vi.mock("@/lib/db", () => ({
  prisma: {
    conversation: { create: vi.fn(), findUnique: vi.fn() },
    message: { create: vi.fn() },
    ticket: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import { GET, POST } from "./route";

function postQuestion(body: unknown) {
  return POST(
    new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

function storedConversation() {
  return {
    id: "conv-1",
    messages: [],
    tickets: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("POST /api/chat", () => {
  it("answers a real question from the knowledge base", async () => {
    vi.mocked(prisma.conversation.create).mockResolvedValue(
      storedConversation(),
    );
    vi.mocked(prisma.message.create).mockResolvedValue({
      id: "msg-1",
      conversationId: "conv-1",
      role: "agent",
      body: "answer",
      citations: [],
      createdAt: new Date(),
    });

    const response = await postQuestion({
      question: "What is the free plan limit?",
    });
    expect(response.status).toBe(200);

    const data = (await response.json()) as {
      answer: string;
      citations: string[];
      matched: boolean;
      mode: string;
      conversationId: string | null;
    };
    expect(data.matched).toBe(true);
    expect(data.mode).toBe("demo");
    expect(data.answer).toContain("10 clients and 30 invoices");
    expect(data.citations).toEqual(["ClientDesk pricing page"]);
    expect(data.conversationId).toBe("conv-1");
  });

  it("reuses an existing conversation instead of creating one", async () => {
    vi.mocked(prisma.conversation.findUnique).mockResolvedValue(
      storedConversation(),
    );
    vi.mocked(prisma.message.create).mockResolvedValue({
      id: "msg-1",
      conversationId: "conv-1",
      role: "agent",
      body: "answer",
      citations: [],
      createdAt: new Date(),
    });

    const response = await postQuestion({
      question: "What is the free plan limit?",
      conversationId: "conv-1",
    });
    expect(response.status).toBe(200);
    expect(prisma.conversation.create).not.toHaveBeenCalled();
    expect(prisma.message.create).toHaveBeenCalledTimes(2);
  });

  it("still answers when the database is unreachable", async () => {
    vi.mocked(prisma.conversation.create).mockRejectedValue(
      new Error("database down"),
    );

    const response = await postQuestion({
      question: "What is the free plan limit?",
    });
    expect(response.status).toBe(200);

    const data = (await response.json()) as {
      answer: string;
      conversationId: string | null;
    };
    expect(data.answer).toContain("10 clients and 30 invoices");
    expect(data.conversationId).toBeNull();
  });

  it("answers honestly when nothing matches", async () => {
    vi.mocked(prisma.conversation.create).mockResolvedValue(
      storedConversation(),
    );
    vi.mocked(prisma.message.create).mockResolvedValue({
      id: "msg-1",
      conversationId: "conv-1",
      role: "agent",
      body: "answer",
      citations: [],
      createdAt: new Date(),
    });

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

describe("GET /api/chat", () => {
  it("returns a conversation transcript", async () => {
    vi.mocked(prisma.conversation.findUnique).mockResolvedValue({
      id: "conv-1",
      messages: [
        {
          id: "msg-1",
          conversationId: "conv-1",
          role: "user",
          body: "What is the free plan limit?",
          citations: [],
          createdAt: new Date(),
        },
        {
          id: "msg-2",
          conversationId: "conv-1",
          role: "agent",
          body: "The Free plan allows 10 clients and 30 invoices.",
          citations: ["ClientDesk pricing page"],
          createdAt: new Date(),
        },
      ],
      tickets: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      // The mock carries the included relations; Prisma's bare
      // findUnique type does not, so the cast keeps tsc happy.
    } as never);

    const response = await GET(
      new Request("http://localhost/api/chat?conversationId=conv-1"),
    );
    expect(response.status).toBe(200);

    const data = (await response.json()) as {
      id: string;
      messages: { role: string; body: string; citations: string[] }[];
    };
    expect(data.id).toBe("conv-1");
    expect(data.messages).toHaveLength(2);
    expect(data.messages[1].citations).toEqual(["ClientDesk pricing page"]);
  });

  it("returns 400 without a conversationId and 404 for an unknown one", async () => {
    const noId = await GET(new Request("http://localhost/api/chat"));
    expect(noId.status).toBe(400);

    vi.mocked(prisma.conversation.findUnique).mockResolvedValue(null);
    const unknown = await GET(
      new Request("http://localhost/api/chat?conversationId=nope"),
    );
    expect(unknown.status).toBe(404);
  });
});
