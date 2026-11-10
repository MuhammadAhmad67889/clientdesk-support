"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type ChatMessage = {
  role: "user" | "agent" | "human";
  text: string;
  citations?: string[];
  mode?: "demo" | "live";
};

// A few questions the agent can definitely answer, so a first-time
// visitor has something to try.
const suggestedQuestions = [
  "How do I export my clients?",
  "I forgot my password",
  "What is the free plan limit?",
];

function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // When embedded on another page (for example the ClientDesk site),
  // the widget loader adds ?embed=1 and the page title is hidden.
  const embedded = searchParams.get("embed") === "1";
  // ?conversation=... reopens a past conversation, so the user can
  // see a human reply to their ticket.
  const reopenId = searchParams.get("conversation");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [ticketBusy, setTicketBusy] = useState(false);

  // Reopen a past conversation once, on first load. The ref stops the
  // effect re-running when our own URL update (below) changes the
  // ?conversation= value — the messages are already on screen then.
  const reopenedRef = useRef(false);
  useEffect(() => {
    if (!reopenId || reopenedRef.current) return;
    reopenedRef.current = true;
    let cancelled = false;
    fetch(`/api/chat?conversationId=${encodeURIComponent(reopenId)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then(
        (data: {
          id: string;
          messages: {
            role: "user" | "agent" | "human";
            body: string;
            citations: string[];
          }[];
        } | null) => {
          if (cancelled || !data) return;
          setConversationId(data.id);
          setMessages(
            data.messages.map((message) => ({
              role: message.role,
              text: message.body,
              citations: message.citations,
            })),
          );
        },
      )
      .catch(() => {
        // Reopening is a nicety; a failed load just leaves a fresh chat.
      });
    return () => {
      cancelled = true;
    };
  }, [reopenId]);

  async function ask(question: string) {
    const text = question.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", text }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, conversationId }),
      });
      const data = (await response.json()) as {
        answer?: string;
        citations?: string[];
        mode?: "demo" | "live";
        conversationId?: string | null;
        error?: string;
      };
      if (data.conversationId && data.conversationId !== conversationId) {
        setConversationId(data.conversationId);
        // Put the conversation in the URL (keeping ?embed=1 when the
        // widget opened it), so a reload, bookmark, or the back button
        // reopens this same chat — and its human replies.
        const params = new URLSearchParams(searchParams.toString());
        params.set("conversation", data.conversationId);
        router.replace(`/chat?${params.toString()}`);
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text:
            data.answer ??
            "Something went wrong on our side. Try again in a moment.",
          citations: data.citations ?? [],
          mode: data.mode ?? "demo",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: "I couldn't reach the support agent. Check your connection and try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function openTicket() {
    if (!conversationId || ticketBusy || ticketId) return;
    setTicketBusy(true);
    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });
      const data = (await response.json()) as {
        id?: string;
        error?: string;
      };
      if (response.ok && data.id) {
        setTicketId(data.id);
        setMessages((prev) => [
          ...prev,
          {
            role: "agent",
            text: `Ticket opened — a human will pick it up. Your ticket reference is ${data.id}. Reopen this chat anytime to see the reply.`,
          },
        ]);
      }
    } finally {
      setTicketBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-8">
      {!embedded && (
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-bold">ClientDesk Support</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Ask a question about ClientDesk. Answers come from the help
            pages, with the source shown.
          </p>
        </header>
      )}

      <div className="flex flex-1 flex-col gap-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-zinc-500">
            Try one of these, or ask your own question:
          </p>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={
              message.role === "user"
                ? "self-end rounded-2xl rounded-br-sm bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
                : message.role === "human"
                  ? "self-start rounded-2xl rounded-bl-sm border-2 border-green-600 bg-white px-4 py-2 text-sm dark:border-green-500 dark:bg-zinc-900"
                  : "self-start rounded-2xl rounded-bl-sm border border-zinc-200 bg-white px-4 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
            }
          >
            {message.role === "agent" && (
              <p className="mb-1 text-xs font-medium text-zinc-500">
                {message.mode === "live"
                  ? "Answer from the help pages"
                  : "Demo answer — quoted from the help pages"}
              </p>
            )}
            {message.role === "human" && (
              <p className="mb-1 text-xs font-medium text-zinc-500">
                Human reply
              </p>
            )}
            <p>{message.text}</p>
            {message.citations && message.citations.length > 0 && (
              <p className="mt-1 text-xs text-zinc-500">
                Source: {message.citations.join(", ")}
              </p>
            )}
          </div>
        ))}
        {sending && (
          <div className="self-start rounded-2xl rounded-bl-sm border border-zinc-200 bg-white px-4 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            Thinking…
          </div>
        )}
      </div>

      {messages.length === 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {suggestedQuestions.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => ask(question)}
              className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              {question}
            </button>
          ))}
        </div>
      )}

      {conversationId && !ticketId && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={openTicket}
            disabled={ticketBusy}
            className="text-sm text-zinc-600 underline disabled:opacity-50 dark:text-zinc-400"
          >
            {ticketBusy
              ? "Opening your ticket…"
              : "Still stuck? Open a ticket for a human"}
          </button>
        </div>
      )}

      {ticketId && (
        <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Ticket open: <span className="font-mono text-xs">{ticketId}</span>
        </p>
      )}

      <form
        className="mt-6 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          ask(input);
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about ClientDesk…"
          aria-label="Your question"
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500/50 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={sending || input.trim().length === 0}
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Send
        </button>
      </form>
    </main>
  );
}

export default function ChatPageWithSuspense() {
  // useSearchParams() needs a Suspense boundary in the app router.
  return (
    <Suspense fallback={null}>
      <ChatPage />
    </Suspense>
  );
}
