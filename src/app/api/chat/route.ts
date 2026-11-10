// POST /api/chat — ask the support agent a question.
//
// Body: { "question": "...", "conversationId": "..." (optional) }
// Returns: { "answer", "citations", "matched", "mode", "conversationId" }.
//
// The conversation is stored so the chat can be reopened and a ticket
// can carry the full transcript. Storage is best-effort: if the
// database is unreachable, the question is still answered and
// conversationId comes back null, because an answer never depends on
// the database.
//
// GET /api/chat?conversationId=... — load a conversation's transcript
// (user, agent, and human replies), so the user can see a human reply
// after reopening the chat.

import { answerQuestion } from "@/lib/llm";
import {
  addMessage,
  createConversation,
  getConversationWithMessages,
} from "@/lib/conversations";

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

  const input =
    body !== null && typeof body === "object"
      ? (body as { question?: unknown; conversationId?: unknown })
      : {};

  if (typeof input.question !== "string" || input.question.trim().length === 0) {
    return Response.json(
      { error: "Provide a question as a non-empty string." },
      { status: 400 },
    );
  }

  const question = input.question;
  const answer = await answerQuestion(question);

  // Save the exchange, but never let storage break the answer.
  let conversationId: string | null = null;
  try {
    if (
      typeof input.conversationId === "string" &&
      input.conversationId.length > 0
    ) {
      const existing = await getConversationWithMessages(input.conversationId);
      if (existing) conversationId = existing.id;
    }
    if (!conversationId) {
      conversationId = (await createConversation()).id;
    }
    await addMessage(conversationId, "user", question);
    await addMessage(
      conversationId,
      "agent",
      answer.answer,
      answer.citations,
      answer.mode,
    );
  } catch (error) {
    console.error("Could not store the chat exchange:", error);
    conversationId = null;
  }

  return Response.json({ ...answer, conversationId });
}

export async function GET(request: Request) {
  const conversationId = new URL(request.url).searchParams.get(
    "conversationId",
  );
  if (!conversationId) {
    return Response.json(
      { error: "Provide a conversationId." },
      { status: 400 },
    );
  }

  const conversation = await getConversationWithMessages(conversationId);
  if (!conversation) {
    return Response.json(
      { error: "Conversation not found." },
      { status: 404 },
    );
  }

  return Response.json({
    id: conversation.id,
    messages: conversation.messages.map((message) => ({
      role: message.role,
      body: message.body,
      citations: message.citations,
      mode: message.mode,
    })),
  });
}
