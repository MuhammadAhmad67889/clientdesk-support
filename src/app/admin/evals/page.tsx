import Link from "next/link";
import { connection } from "next/server";

import { prisma } from "@/lib/db";
import RunEvalsButton from "./RunEvalsButton";

// Rendered fresh on every request: the run history must be current.
// connection() opts this page out of static rendering, and
// `instant = false` allows the blocking (fully dynamic) route under
// Next 16's Cache Components, which otherwise rejects it at build
// time.

export const instant = false;

export default async function EvalsPage() {
  await connection();
  // The evals page: run the scripted scenarios and see the history.
  // A scenario passes when the agent cites the expected source — or,
  // for the "no answer" scenarios, when it honestly says it does not
  // know instead of inventing one.
  let runs: {
    id: string;
    passed: boolean;
    answer: string;
    createdAt: Date;
    scenario: { question: string; expectedSource: string };
  }[] = [];
  let loadFailed = false;
  try {
    runs = await prisma.evalRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { scenario: true },
    });
  } catch (error) {
    console.error("Could not load eval runs:", error);
    loadFailed = true;
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <Link
        href="/admin"
        className="text-sm text-zinc-600 underline dark:text-zinc-400"
      >
        ← All tickets
      </Link>
      <header className="mt-4 mb-6">
        <h1 className="text-2xl font-bold">Scripted evals</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Fixed questions with expected answers, run through the agent in
          demo mode. A failing scenario means the knowledge base or the
          search needs a look.
        </p>
      </header>

      <RunEvalsButton />

      {loadFailed && (
        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          Couldn&apos;t load the run history — the database isn&apos;t
          reachable right now.
        </p>
      )}

      {!loadFailed && runs.length === 0 && (
        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          No runs yet. Press &ldquo;Run evals&rdquo; to check the agent
          against the scripted scenarios.
        </p>
      )}

      {!loadFailed && runs.length > 0 && (
        <ul className="mt-6 flex flex-col gap-3">
          {runs.map((run) => (
            <li
              key={run.id}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-2 text-xs font-medium">
                <span
                  className={
                    run.passed
                      ? "rounded-full bg-green-100 px-2 py-0.5 text-green-800 dark:bg-green-900 dark:text-green-100"
                      : "rounded-full bg-red-100 px-2 py-0.5 text-red-800 dark:bg-red-900 dark:text-red-100"
                  }
                >
                  {run.passed ? "passed" : "failed"}
                </span>
                <span className="text-zinc-500">
                  {new Date(run.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium">
                {run.scenario.question}
              </p>
              <p className="text-xs text-zinc-500">
                Expected source:{" "}
                {run.scenario.expectedSource || "(no answer expected)"}
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {run.answer}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
