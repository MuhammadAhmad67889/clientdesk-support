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
import { evalScenarios } from "@/lib/evals";
import { POST } from "./route";

describe("POST /api/evals/run", () => {
  it("runs all scenarios and reports the score", async () => {
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

    const response = await POST();
    expect(response.status).toBe(200);

    const data = (await response.json()) as {
      total: number;
      passed: number;
      failed: number;
      results: { passed: boolean }[];
    };
    expect(data.total).toBe(9);
    expect(data.passed).toBe(9);
    expect(data.failed).toBe(0);
    expect(data.results).toHaveLength(9);
  });
});
