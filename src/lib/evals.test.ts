import { describe, expect, it, vi } from "vitest";

// The database is mocked (scenarios come from the evalScenarios list,
// runs are recorded by a mocked create), but the answers run through
// the real demo path — so this also proves the scenarios' expectations
// hold against the real search.
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
import { evalScenarios, runEvalScenarios } from "./evals";

describe("runEvalScenarios", () => {
  it("passes every scripted scenario in demo mode", async () => {
    vi.mocked(prisma.evalScenario.findMany).mockResolvedValue(
      evalScenarios.map((scenario, index) => ({
        id: `scenario-${index}`,
        question: scenario.question,
        expectedSource: scenario.expectedSource,
        createdAt: new Date(),
      })),
    );
    vi.mocked(prisma.evalRun.create).mockResolvedValue({
      id: "run-1",
      scenarioId: "scenario-0",
      passed: true,
      answer: "answer",
      createdAt: new Date(),
    });

    const summary = await runEvalScenarios();
    expect(summary.total).toBe(8);
    expect(summary.passed).toBe(8);
    expect(summary.failed).toBe(0);
    expect(prisma.evalRun.create).toHaveBeenCalledTimes(8);
  });

  it("records a failure when the agent cites the wrong source", async () => {
    vi.mocked(prisma.evalScenario.findMany).mockResolvedValue([
      {
        id: "scenario-0",
        question: "How do I export my clients?",
        // Wrong on purpose: the agent will cite the clients page.
        expectedSource: "ClientDesk pricing page",
        createdAt: new Date(),
      },
    ]);
    vi.mocked(prisma.evalRun.create).mockResolvedValue({
      id: "run-1",
      scenarioId: "scenario-0",
      passed: false,
      answer: "answer",
      createdAt: new Date(),
    });

    const summary = await runEvalScenarios();
    expect(summary.total).toBe(1);
    expect(summary.passed).toBe(0);
    expect(summary.failed).toBe(1);
    expect(summary.results[0].expectedSource).toBe(
      "ClientDesk pricing page",
    );
  });
});
