import { describe, expect, it, vi } from "vitest";

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
import { POST } from "./route";

function postTicket(body: unknown) {
  return POST(
    new Request("http://localhost/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/tickets", () => {
  it("opens a ticket, escalated when the agent could not answer", async () => {
    vi.mocked(prisma.conversation.findUnique).mockResolvedValue({
      id: "conv-1",
      messages: [
        {
          id: "msg-1",
          conversationId: "conv-1",
          role: "user",
          body: "What is the weather today?",
          citations: [],
          createdAt: new Date(),
        },
        {
          id: "msg-2",
          conversationId: "conv-1",
          role: "agent",
          body: "I couldn't find an answer to that in the ClientDesk help pages.",
          citations: [],
          createdAt: new Date(),
        },
      ],
      tickets: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      // The mock carries the included relations; Prisma's bare
      // findUnique type does not, so the cast keeps tsc happy.
    } as never);
    vi.mocked(prisma.ticket.create).mockResolvedValue({
      id: "tick-1",
      conversationId: "conv-1",
      status: "open",
      escalated: true,
      resolvedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await postTicket({ conversationId: "conv-1" });
    expect(response.status).toBe(201);

    const data = (await response.json()) as {
      id: string;
      status: string;
      escalated: boolean;
    };
    expect(data).toEqual({ id: "tick-1", status: "open", escalated: true });
  });

  it("returns 400 without a conversationId and 404 for an unknown one", async () => {
    const noId = await postTicket({});
    expect(noId.status).toBe(400);

    vi.mocked(prisma.conversation.findUnique).mockResolvedValue(null);
    const unknown = await postTicket({ conversationId: "nope" });
    expect(unknown.status).toBe(404);
  });
});
