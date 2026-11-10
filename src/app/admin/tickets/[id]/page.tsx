import Link from "next/link";
import { connection } from "next/server";

import { getTicketWithConversation } from "@/lib/conversations";
import ReplyForm from "./ReplyForm";
import CloseButton from "./CloseButton";

// Rendered fresh on every request: the transcript must include the
// latest replies, not the ones that existed at build time.
// connection() opts this page out of static rendering, and
// `instant = false` allows the blocking (fully dynamic) route under
// Next 16's Cache Components, which otherwise rejects it at build
// time.

export const instant = false;

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;

  let ticket: Awaited<ReturnType<typeof getTicketWithConversation>> | null =
    null;
  try {
    ticket = await getTicketWithConversation(id);
  } catch (error) {
    console.error("Could not load the ticket:", error);
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <Link
        href="/admin"
        className="text-sm text-zinc-600 underline dark:text-zinc-400"
      >
        ← All tickets
      </Link>

      {!ticket && (
        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          Couldn&apos;t load this ticket — it may not exist, or the
          database isn&apos;t reachable right now.
        </p>
      )}

      {ticket && (
        <>
          <header className="mt-4 mb-6">
            <h1 className="text-2xl font-bold">Ticket {ticket.id}</h1>
            <div className="mt-2 flex items-center gap-2 text-xs font-medium">
              <span className="rounded-full bg-zinc-200 px-2 py-0.5 dark:bg-zinc-700">
                {ticket.status}
              </span>
              {ticket.escalated && (
                <span className="rounded-full bg-zinc-200 px-2 py-0.5 dark:bg-zinc-700">
                  escalated — agent couldn&apos;t answer
                </span>
              )}
              <span className="text-zinc-500">
                Opened {new Date(ticket.createdAt).toLocaleString()}
              </span>
            </div>
          </header>

          <div className="flex flex-col gap-3">
            {ticket.conversation.messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "user"
                    ? "self-end rounded-2xl rounded-br-sm bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : message.role === "human"
                      ? "self-start rounded-2xl rounded-bl-sm border-2 border-green-600 bg-white px-4 py-2 text-sm dark:border-green-500 dark:bg-zinc-900"
                      : "self-start rounded-2xl rounded-bl-sm border border-zinc-200 bg-white px-4 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                }
              >
                <p className="mb-1 text-xs font-medium text-zinc-500">
                  {message.role === "user"
                    ? "User"
                    : message.role === "human"
                      ? "Human reply"
                      : "Agent answer"}
                </p>
                <p>{message.body}</p>
                {message.citations.length > 0 && (
                  <p className="mt-1 text-xs text-zinc-500">
                    Source: {message.citations.join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>

          {ticket.status !== "resolved" && (
            <>
              <ReplyForm ticketId={ticket.id} />
              <div className="mt-3">
                <CloseButton ticketId={ticket.id} />
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}
