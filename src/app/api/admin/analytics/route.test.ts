import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    conversation: { create: vi.fn(), findUnique: vi.fn(), count: vi.fn() },
    message: { create: vi.fn(), findMany: vi.fn() },
    ticket: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    evalScenario: { findMany: vi.fn() },
    evalRun: { create: vi.fn(), findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/db";
import { GET } from "./route";

describe("GET /api/admin/analytics", () => {
  it("returns the computed summary", async () => {
    vi.mocked(prisma.conversation.count).mockResolvedValue(1);
    vi.mocked(prisma.message.findMany).mockResolvedValue([
      {
        id: "msg-1",
        conversationId: "conv-1",
        role: "user",
        body: "What is the free plan limit?",
        citations: [],
        mode: "demo",
        createdAt: new Date(),
      },
      {
        id: "msg-2",
        conversationId: "conv-1",
        role: "agent",
        body: "The Free plan allows 10 clients and 30 invoices.",
        citations: ["ClientDesk pricing page"],
        mode: "demo",
        createdAt: new Date(),
      },
    ]);
    vi.mocked(prisma.ticket.findMany).mockResolvedValue([]);

    const response = await GET();
    expect(response.status).toBe(200);

    const data = (await response.json()) as {
      totalQuestions: number;
      answered: number;
      answerRate: number;
    };
    expect(data.totalQuestions).toBe(1);
    expect(data.answered).toBe(1);
    expect(data.answerRate).toBe(100);
  });

  it("returns 503 when the database is unreachable", async () => {
    vi.mocked(prisma.conversation.count).mockRejectedValue(
      new Error("database down"),
    );

    const response = await GET();
    expect(response.status).toBe(503);
  });
});
