import Link from "next/link";
import { connection } from "next/server";

import { listTickets } from "@/lib/conversations";

// Rendered fresh on every request: the inbox must show the tickets
// as they are now, not as they were at build time. connection() opts
// this page out of static rendering, and `instant = false` allows
// the blocking (fully dynamic) route under Next 16's Cache
// Components, which otherwise rejects it at build time.

export const instant = false;

export default async function AdminPage() {
  await connection();
  let tickets: Awaited<ReturnType<typeof listTickets>> | null = null;
  try {
    tickets = await listTickets();
  } catch (error) {
    console.error("Could not load tickets:", error);
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Support tickets</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Open tickets first. Click one to read the full conversation and
          reply as a human.
        </p>
      </header>

      {!tickets && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Couldn&apos;t load the tickets — the database isn&apos;t reachable
          right now. Try again in a moment.
        </p>
      )}

      {tickets && tickets.length === 0 && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No tickets yet. When someone opens one from the chat, it shows
          up here.
        </p>
      )}

      {tickets && tickets.length > 0 && (
        <ul className="flex flex-col gap-3">
          {tickets.map((ticket) => {
            const firstMessage = ticket.conversation.messages[0];
            return (
              <li key={ticket.id}>
                <Link
                  href={`/admin/tickets/${ticket.id}`}
                  className="block rounded-2xl border border-zinc-200 bg-white px-4 py-3 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                >
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <span
                      className={
                        ticket.status === "open"
                          ? "rounded-full bg-red-100 px-2 py-0.5 text-red-800 dark:bg-red-900 dark:text-red-100"
                          : ticket.status === "pending"
                            ? "rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
                            : "rounded-full bg-green-100 px-2 py-0.5 text-green-800 dark:bg-green-900 dark:text-green-100"
                      }
                    >
                      {ticket.status}
                    </span>
                    {ticket.escalated && (
                      <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                        escalated — agent couldn&apos;t answer
                      </span>
                    )}
                    <span className="text-zinc-500">
                      {new Date(ticket.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">
                    {firstMessage?.body ??
                      "No messages in this conversation."}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
