"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// The reply box on a ticket. Posts to the reply API, then refreshes
// the page so the new human message shows in the transcript.
export default function ReplyForm({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!content.trim() || sending) return;
    setSending(true);
    setError("");

    const response = await fetch(`/api/admin/tickets/${ticketId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.trim() }),
    });

    if (!response.ok) {
      setError("The reply didn't send. Try again.");
      setSending(false);
      return;
    }

    setContent("");
    setSending(false);
    router.refresh();
  }

  return (
    <form onSubmit={send} className="mt-6">
      <label
        htmlFor="reply"
        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        Reply as a human
      </label>
      <textarea
        id="reply"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={4}
        placeholder="Write your reply…"
        className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500/50 dark:border-zinc-700 dark:bg-zinc-900"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={sending || content.trim().length === 0}
        className="mt-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {sending ? "Sending…" : "Send reply"}
      </button>
    </form>
  );
}
