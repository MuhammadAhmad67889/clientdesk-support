// POST /api/evals/run — run every scripted eval scenario and record
// the result. Runs in demo mode (deterministic), so a run is
// reproducible. Returns { total, passed, failed, results }.

import { runEvalScenarios } from "@/lib/evals";

export async function POST() {
  try {
    return Response.json(await runEvalScenarios());
  } catch (error) {
    console.error("Could not run evals:", error);
    return Response.json(
      { error: "Evals could not run — the database isn't reachable." },
      { status: 503 },
    );
  }
}
