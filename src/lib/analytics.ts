// Analytics for the admin: how the support agent is doing.
//
// computeAnalytics is pure — it takes rows and returns numbers — so
// it is tested with fixtures and needs no database. getAnalytics
// does the queries and hands the rows to it.

import { prisma } from "./db";

export type AnalyticsSummary = {
  totalConversations: number;
  totalQuestions: number;
  // Agent answers that quoted a knowledge base passage.
  answered: number;
  // Agent answers that could not find anything.
  unanswered: number;
  // Share of agent answers that matched a passage, in percent.
  answerRate: number;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  // Share of tickets that were escalated, in percent.
  escalationRate: number;
  // The most-asked questions, most common first (top 5).
  topQuestions: { question: string; count: number }[];
  // Questions the agent could not answer, most recent first.
  unansweredQuestions: string[];
};

type MessageRow = {
  role: string;
  body: string;
  citations: string[];
};

type TicketRow = {
  status: string;
  escalated: boolean;
};

export function computeAnalytics(
  conversationCount: number,
  messages: MessageRow[],
  tickets: TicketRow[],
): AnalyticsSummary {
  const userMessages = messages.filter((m) => m.role === "user");
  const agentMessages = messages.filter((m) => m.role === "agent");
  const answered = agentMessages.filter((m) => m.citations.length > 0);
  const unanswered = agentMessages.filter((m) => m.citations.length === 0);

  // The question before an unanswered agent message is the question
  // the agent could not answer. (Messages are stored in order, so
  // the user message right before an agent message is its question.)
  const unansweredQuestions: string[] = [];
  messages.forEach((message, index) => {
    if (
      message.role === "agent" &&
      message.citations.length === 0 &&
      index > 0 &&
      messages[index - 1].role === "user"
    ) {
      unansweredQuestions.push(messages[index - 1].body);
    }
  });

  const counts = new Map<string, number>();
  for (const message of userMessages) {
    const question = message.body.trim().toLowerCase();
    counts.set(question, (counts.get(question) ?? 0) + 1);
  }
  const topQuestions = [...counts.entries()]
    .map(([question, count]) => ({ question, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const openTickets = tickets.filter((t) => t.status === "open").length;
  const resolvedTickets = tickets.filter(
    (t) => t.status === "resolved",
  ).length;
  const escalated = tickets.filter((t) => t.escalated).length;

  return {
    totalConversations: conversationCount,
    totalQuestions: userMessages.length,
    answered: answered.length,
    unanswered: unanswered.length,
    answerRate:
      agentMessages.length === 0
        ? 100
        : Math.round((answered.length / agentMessages.length) * 100),
    totalTickets: tickets.length,
    openTickets,
    resolvedTickets,
    escalationRate:
      tickets.length === 0
        ? 0
        : Math.round((escalated / tickets.length) * 100),
    topQuestions,
    unansweredQuestions,
  };
}

export async function getAnalytics(): Promise<AnalyticsSummary> {
  const [conversationCount, messages, tickets] = await Promise.all([
    prisma.conversation.count(),
    prisma.message.findMany({
      orderBy: { createdAt: "asc" },
      select: { role: true, body: true, citations: true },
    }),
    prisma.ticket.findMany({
      select: { status: true, escalated: true },
    }),
  ]);
  return computeAnalytics(conversationCount, messages, tickets);
}
