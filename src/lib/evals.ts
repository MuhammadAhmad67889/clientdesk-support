// Scripted evals: fixed questions with expected answers.
//
// Each scenario is a question plus the source the agent should cite.
// An empty expectedSource means the agent should NOT match anything
// (the question has no answer in the help pages). The scenarios live
// in the database (seeded from this list), and runEvalScenarios runs
// them all through the real answer path and records pass/fail per
// scenario. Demo mode is used for evals: it is deterministic, so a
// run is reproducible.

import { answerQuestion } from "./llm";
import { prisma } from "./db";

export const evalScenarios: { question: string; expectedSource: string }[] =
  [
    {
      question: "How do I export my clients?",
      expectedSource: "ClientDesk clients page",
    },
    {
      question: "I forgot my password",
      expectedSource: "ClientDesk auth pages",
    },
    {
      question: "What is the free plan limit?",
      expectedSource: "ClientDesk pricing page",
    },
    {
      question: "How do I pay for Pro?",
      expectedSource: "ClientDesk pricing page",
    },
    {
      question: "How do I delete my account?",
      expectedSource: "ClientDesk settings page",
    },
    {
      question: "How do I record a partial payment?",
      expectedSource: "ClientDesk invoice page",
    },
    // No passage covers these, so the honest answer is "I don't know".
    { question: "What is the weather today?", expectedSource: "" },
    { question: "Is there a dark mode?", expectedSource: "" },
  ];

export type EvalResult = {
  scenarioId: string;
  question: string;
  expectedSource: string;
  passed: boolean;
  answer: string;
};

export async function runEvalScenarios(): Promise<{
  total: number;
  passed: number;
  failed: number;
  results: EvalResult[];
}> {
  const scenarios = await prisma.evalScenario.findMany({
    orderBy: { createdAt: "asc" },
  });

  const results: EvalResult[] = [];
  for (const scenario of scenarios) {
    const answer = await answerQuestion(scenario.question);
    const passed =
      scenario.expectedSource === ""
        ? !answer.matched
        : answer.matched &&
          answer.citations.includes(scenario.expectedSource);

    await prisma.evalRun.create({
      data: {
        scenarioId: scenario.id,
        passed,
        answer: answer.answer,
      },
    });

    results.push({
      scenarioId: scenario.id,
      question: scenario.question,
      expectedSource: scenario.expectedSource,
      passed,
      answer: answer.answer,
    });
  }

  return {
    total: results.length,
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
    results,
  };
}
