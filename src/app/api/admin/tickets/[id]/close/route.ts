// POST /api/admin/tickets/[id]/close — resolve a ticket.
//
// No body needed. Sets the status to "resolved" and records when.

import { resolveTicket } from "@/lib/conversations";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const ticket = await resolveTicket(id);
    return Response.json({ id: ticket.id, status: ticket.status });
  } catch {
    return Response.json(
      { error: "Ticket not found." },
      { status: 404 },
    );
  }
}
