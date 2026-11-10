import Link from "next/link";
import { connection } from "next/server";

import { getAnalytics } from "@/lib/analytics";

// Rendered fresh on every request: the numbers must be current.
// connection() opts this page out of static rendering, and
// `instant = false` allows the blocking (fully dynamic) route under
// Next 16's Cache Components, which otherwise rejects it at build
// time.

export const instant = false;

export default async function AnalyticsPage() {
  await connection();
  let analytics: Awaited<ReturnType<typeof getAnalytics>> | null = null;
  try {
    analytics = await getAnalytics();
  } catch (error) {
    console.error("Could not load analytics:", error);
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
        <h1 className="text-2xl font-bold">Support analytics</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          How the agent is doing, and where the help pages have gaps.
        </p>
      </header>

      {!analytics && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Couldn&apos;t load the numbers — the database isn&apos;t reachable
          right now.
        </p>
      )}

      {analytics && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              ["Conversations", analytics.totalConversations],
              ["Questions", analytics.totalQuestions],
              ["Answered", analytics.answered],
              ["Unanswered", analytics.unanswered],
              ["Answer rate", `${analytics.answerRate}%`],
              ["Tickets", analytics.totalTickets],
              ["Open tickets", analytics.openTickets],
              ["Resolved", analytics.resolvedTickets],
              ["Escalated", `${analytics.escalationRate}%`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="text-xs text-zinc-500">{label}</p>
                <p className="mt-1 text-xl font-bold">{value}</p>
              </div>
            ))}
          </div>

          <section>
            <h2 className="text-lg font-semibold">Most asked questions</h2>
            {analytics.topQuestions.length === 0 ? (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                No questions yet.
              </p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {analytics.topQuestions.map((item) => (
                  <li
                    key={item.question}
                    className="flex justify-between rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <span>{item.question}</span>
                    <span className="font-medium">×{item.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold">
              Questions the agent could not answer
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Each one is a gap in the help pages — a new passage here
              would let the agent answer it next time.
            </p>
            {analytics.unansweredQuestions.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                None — the agent answered everything so far.
              </p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {analytics.unansweredQuestions.map((question, index) => (
                  <li
                    key={index}
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    {question}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
