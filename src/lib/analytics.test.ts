import { describe, expect, it } from "vitest";

import { computeAnalytics } from "./analytics";

const messages = [
  { role: "user", body: "How do I export my clients?", citations: [] },
  {
    role: "agent",
    body: "You can export your clients as a CSV file.",
    citations: ["ClientDesk clients page"],
  },
  { role: "user", body: "How do I export my clients?", citations: [] },
  {
    role: "agent",
    body: "You can export your clients as a CSV file.",
    citations: ["ClientDesk clients page"],
  },
  { role: "user", body: "What is the weather today?", citations: [] },
  {
    role: "agent",
    body: "I couldn't find an answer to that in the ClientDesk help pages.",
    citations: [],
  },
];

const tickets = [
  { status: "open", escalated: true },
  { status: "resolved", escalated: false },
];

describe("computeAnalytics", () => {
  it("counts questions, answers, and the answer rate", () => {
    const summary = computeAnalytics(2, messages, tickets);
    expect(summary.totalConversations).toBe(2);
    expect(summary.totalQuestions).toBe(3);
    expect(summary.answered).toBe(2);
    expect(summary.unanswered).toBe(1);
    expect(summary.answerRate).toBe(67);
  });

  it("counts tickets and the escalation rate", () => {
    const summary = computeAnalytics(2, messages, tickets);
    expect(summary.totalTickets).toBe(2);
    expect(summary.openTickets).toBe(1);
    expect(summary.resolvedTickets).toBe(1);
    expect(summary.escalationRate).toBe(50);
  });

  it("ranks the most-asked questions and lists the unanswered ones", () => {
    const summary = computeAnalytics(2, messages, tickets);
    expect(summary.topQuestions[0]).toEqual({
      question: "how do i export my clients?",
      count: 2,
    });
    expect(summary.unansweredQuestions).toEqual([
      "What is the weather today?",
    ]);
  });

  it("does not divide by zero on an empty database", () => {
    const summary = computeAnalytics(0, [], []);
    expect(summary.answerRate).toBe(100);
    expect(summary.escalationRate).toBe(0);
    expect(summary.topQuestions).toEqual([]);
    expect(summary.unansweredQuestions).toEqual([]);
  });
});
