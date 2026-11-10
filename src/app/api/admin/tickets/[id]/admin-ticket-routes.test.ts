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
import { POST as reply } from "./reply/route";
import { POST as close } from "./close/route";

function ticketRow() {
  return {
    id: "tick-1",
    conversationId: "conv-1",
    status: "open",
    escalated: true,
    resolvedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("POST /api/admin/tickets/[id]/reply", () => {
  it("stores the human reply", async () => {
    vi.mocked(prisma.ticket.findUnique).mockResolvedValue(ticketRow());
    vi.mocked(prisma.message.create).mockResolvedValue({
      id: "msg-9",
      conversationId: "conv-1",
      role: "human",
      body: "On it.",
      citations: [],
      mode: "demo",
      createdAt: new Date(),
    });

    const response = await reply(
      new Request("http://localhost/api/admin/tickets/tick-1/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "On it." }),
      }),
      { params: Promise.resolve({ id: "tick-1" }) },
    );
    expect(response.status).toBe(200);

    const data = (await response.json()) as { role: string };
    expect(data.role).toBe("human");
  });

  it("returns 400 for an empty reply and 404 for an unknown ticket", async () => {
    const empty = await reply(
      new Request("http://localhost/api/admin/tickets/tick-1/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "  " }),
      }),
      { params: Promise.resolve({ id: "tick-1" }) },
    );
    expect(empty.status).toBe(400);

    vi.mocked(prisma.ticket.findUnique).mockResolvedValue(null);
    const unknown = await reply(
      new Request("http://localhost/api/admin/tickets/nope/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "On it." }),
      }),
      { params: Promise.resolve({ id: "nope" }) },
    );
    expect(unknown.status).toBe(404);
  });
});

describe("POST /api/admin/tickets/[id]/close", () => {
  it("resolves the ticket, and 404s when it does not exist", async () => {
    vi.mocked(prisma.ticket.update).mockResolvedValue({
      ...ticketRow(),
      status: "resolved",
      resolvedAt: new Date(),
    });

    const response = await close(new Request("http://localhost/x", { method: "POST" }), {
      params: Promise.resolve({ id: "tick-1" }),
    });
    expect(response.status).toBe(200);

    const data = (await response.json()) as { status: string };
    expect(data.status).toBe("resolved");

    vi.mocked(prisma.ticket.update).mockRejectedValue(new Error("not found"));
    const unknown = await close(new Request("http://localhost/x", { method: "POST" }), {
      params: Promise.resolve({ id: "nope" }),
    });
    expect(unknown.status).toBe(404);
  });
});
