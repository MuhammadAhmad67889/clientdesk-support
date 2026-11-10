// Conversations, messages, and tickets.
//
// These are thin wrappers around Prisma — they hold the rules (when a
// ticket counts as escalated, what a human reply does to a ticket) so
// the API routes stay small. They throw when the database is
// unreachable; the chat route catches that and still answers, because
// an answer never depends on the database.

import { prisma } from "./db";

export async function createConversation() {
  return prisma.conversation.create({ data: {} });
}

export async function addMessage(
  conversationId: string,
  role: "user" | "agent" | "human",
  body: string,
  citations: string[] = [],
) {
  return prisma.message.create({
    data: { conversationId, role, body, citations },
  });
}

export async function getConversationWithMessages(id: string) {
  return prisma.conversation.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      tickets: true,
    },
  });
}

// A ticket is escalated when the agent could not answer the question
// — the last agent message has no citations — because that is the
// case that most needs a human. A ticket opened after a good answer
// is not escalated.
export async function createTicket(conversationId: string) {
  const conversation = await getConversationWithMessages(conversationId);
  if (!conversation) return null;

  const agentMessages = conversation.messages.filter(
    (message) => message.role === "agent",
  );
  const lastAgent = agentMessages[agentMessages.length - 1];
  const escalated = !lastAgent || lastAgent.citations.length === 0;

  return prisma.ticket.create({
    data: { conversationId, escalated },
  });
}

export async function listTickets() {
  // "open" sorts before "pending" before "resolved", so the tickets
  // that need a human come first, newest first within each status.
  return prisma.ticket.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      conversation: {
        include: {
          messages: { orderBy: { createdAt: "asc" }, take: 1 },
        },
      },
    },
  });
}

export async function getTicketWithConversation(id: string) {
  return prisma.ticket.findUnique({
    where: { id },
    include: {
      conversation: {
        include: { messages: { orderBy: { createdAt: "asc" } } },
      },
    },
  });
}

// A human reply goes into the same conversation, so the user sees it
// when they reopen the chat, and the ticket moves to "pending" —
// waiting on the user, not on us.
export async function addHumanReply(ticketId: string, body: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
  });
  if (!ticket) return null;

  const message = await addMessage(ticket.conversationId, "human", body);
  await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: "pending" },
  });
  return message;
}

export async function resolveTicket(ticketId: string) {
  return prisma.ticket.update({
    where: { id: ticketId },
    data: { status: "resolved", resolvedAt: new Date() },
  });
}
