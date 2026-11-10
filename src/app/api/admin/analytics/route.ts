// GET /api/admin/analytics — the numbers behind the support agent:
// how many questions, how many answered, top questions, and the ones
// the agent could not answer (those are the gaps in the help pages).

import { getAnalytics } from "@/lib/analytics";

export async function GET() {
  try {
    return Response.json(await getAnalytics());
  } catch (error) {
    console.error("Could not load analytics:", error);
    return Response.json(
      { error: "Analytics are unavailable — the database isn't reachable." },
      { status: 503 },
    );
  }
}
