import { describe, expect, it, vi } from "vitest";

// The database is mocked: these tests check the rules in
// conversations.ts, not a real Postgres. The real database path runs
// in CI (postgres service) once the repo is pushed.
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
import {
  addHumanReply,
  createTicket,
  resolveTicket,
} from "./conversations";

function conversationWithAgentMessages(
  agentCitations: string[][],
) {
  return {
    id: "conv-1",
    messages: agentCitations.map((citations, i) => ({
      id: `msg-${i}`,
      role: "agent",
      body: "an answer",
      citations,
      conversationId: "conv-1",
      createdAt: new Date(),
    })),
    tickets: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("createTicket", () => {
  it("marks the ticket escalated when the agent could not answer", async () => {
    vi.mocked(prisma.conversation.findUnique).mockResolvedValue(
      conversationWithAgentMessages([[]]),
    );
    vi.mocked(prisma.ticket.create).mockResolvedValue({
      id: "tick-1",
      conversationId: "conv-1",
      status: "open",
      escalated: true,
      resolvedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const ticket = await createTicket("conv-1");
    expect(ticket?.escalated).toBe(true);
    expect(prisma.ticket.create).toHaveBeenCalledWith({
      data: { conversationId: "conv-1", escalated: true },
    });
  });

  it("does not escalate when the agent answered with a source", async () => {
    vi.mocked(prisma.conversation.findUnique).mockResolvedValue(
      conversationWithAgentMessages([["ClientDesk pricing page"]]),
    );
    vi.mocked(prisma.ticket.create).mockResolvedValue({
      id: "tick-2",
      conversationId: "conv-1",
      status: "open",
      escalated: false,
      resolvedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const ticket = await createTicket("conv-1");
    expect(ticket?.escalated).toBe(false);
  });

  it("returns null when the conversation does not exist", async () => {
    vi.mocked(prisma.conversation.findUnique).mockResolvedValue(null);
    await expect(createTicket("missing")).resolves.toBeNull();
    expect(prisma.ticket.create).not.toHaveBeenCalled();
  });
});

describe("addHumanReply", () => {
  it("stores a human message and moves the ticket to pending", async () => {
    vi.mocked(prisma.ticket.findUnique).mockResolvedValue({
      id: "tick-1",
      conversationId: "conv-1",
      status: "open",
      escalated: true,
      resolvedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.message.create).mockResolvedValue({
      id: "msg-9",
      conversationId: "conv-1",
      role: "human",
      body: "Let me check that for you.",
      citations: [],
      mode: "demo",
      createdAt: new Date(),
    });

    const message = await addHumanReply(
      "tick-1",
      "Let me check that for you.",
    );
    expect(message?.role).toBe("human");
    expect(prisma.message.create).toHaveBeenCalledWith({
      data: {
        conversationId: "conv-1",
        role: "human",
        body: "Let me check that for you.",
        citations: [],
        mode: "demo",
      },
    });
    expect(prisma.ticket.update).toHaveBeenCalledWith({
      where: { id: "tick-1" },
      data: { status: "pending" },
    });
  });

  it("returns null for an unknown ticket", async () => {
    vi.mocked(prisma.ticket.findUnique).mockResolvedValue(null);
    await expect(addHumanReply("missing", "hi")).resolves.toBeNull();
  });
});

describe("resolveTicket", () => {
  it("marks the ticket resolved with a timestamp", async () => {
    vi.mocked(prisma.ticket.update).mockResolvedValue({
      id: "tick-1",
      conversationId: "conv-1",
      status: "resolved",
      escalated: false,
      resolvedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const ticket = await resolveTicket("tick-1");
    expect(ticket.status).toBe("resolved");
    expect(prisma.ticket.update).toHaveBeenCalledWith({
      where: { id: "tick-1" },
      data: { status: "resolved", resolvedAt: expect.any(Date) },
    });
  });
});
