"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Marks a ticket resolved. Posts to the close API, then refreshes so
// the new status shows.
export default function CloseButton({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [closing, setClosing] = useState(false);

  async function close() {
    if (closing) return;
    setClosing(true);
    await fetch(`/api/admin/tickets/${ticketId}/close`, { method: "POST" });
    setClosing(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={close}
      disabled={closing}
      className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      {closing ? "Closing…" : "Mark resolved"}
    </button>
  );
}
