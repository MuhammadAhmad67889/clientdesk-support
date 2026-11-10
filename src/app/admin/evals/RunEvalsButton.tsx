"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Runs the scripted evals and shows the score. The run is recorded
// in the database, so the history below grows with each run.
export default function RunEvalsButton() {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function run() {
    if (running) return;
    setRunning(true);
    setError("");
    setSummary(null);

    try {
      const response = await fetch("/api/evals/run", { method: "POST" });
      const data = (await response.json()) as {
        total?: number;
        passed?: number;
        failed?: number;
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "The eval run failed.");
      } else {
        setSummary(
          `${data.passed} of ${data.total} scenarios passed (${data.failed} failed).`,
        );
        router.refresh();
      }
    } catch {
      setError("The eval run failed. Check your connection and try again.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={run}
        disabled={running}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {running ? "Running…" : "Run evals"}
      </button>
      {summary && <p className="mt-2 text-sm font-medium">{summary}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
