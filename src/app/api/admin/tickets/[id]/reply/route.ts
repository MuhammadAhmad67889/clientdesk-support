// POST /api/admin/tickets/[id]/reply — a human replies to a ticket.
//
// Body: { "content": "..." }
// The reply is stored as a "human" message in the same conversation,
// so the user sees it when they reopen the chat, and the ticket moves
// to "pending" (waiting on the user).

import { addHumanReply } from "@/lib/conversations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const content =
    body !== null && typeof body === "object"
      ? (body as { content?: unknown }).content
      : undefined;

  if (typeof content !== "string" || content.trim().length === 0) {
    return Response.json(
      { error: "Provide a reply as a non-empty string." },
      { status: 400 },
    );
  }

  const message = await addHumanReply(id, content.trim());
  if (!message) {
    return Response.json(
      { error: "Ticket not found." },
      { status: 404 },
    );
  }

  return Response.json({ id: message.id, role: message.role });
}
