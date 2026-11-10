// POST /api/tickets — open a ticket for a conversation.
//
// Body: { "conversationId": "..." }
// Returns: { "id", "status", "escalated" } with 201.
// The ticket carries the conversation, so a human sees the full
// transcript in the admin inbox. A ticket opened after an unanswered
// question is marked escalated (see conversations.ts).

import { createTicket } from "@/lib/conversations";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const conversationId =
    body !== null && typeof body === "object"
      ? (body as { conversationId?: unknown }).conversationId
      : undefined;

  if (typeof conversationId !== "string" || conversationId.length === 0) {
    return Response.json(
      { error: "Provide a conversationId." },
      { status: 400 },
    );
  }

  const ticket = await createTicket(conversationId);
  if (!ticket) {
    return Response.json(
      { error: "Conversation not found." },
      { status: 404 },
    );
  }

  return Response.json(
    { id: ticket.id, status: ticket.status, escalated: ticket.escalated },
    { status: 201 },
  );
}
