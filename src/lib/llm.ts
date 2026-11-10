// LLM providers for the support agent.
//
// One interface, two implementations (see the spec):
// - Demo provider (default, no key): quotes the best knowledge base
//   passage verbatim. It generates no text.
// - Groq provider (live, needs GROQ_API_KEY): a real LLM answer
//   grounded in the retrieved passages. The model is told to answer
//   ONLY from those passages, and any source it names that was not
//   in the passages is dropped, so a hallucinated citation can never
//   reach the user.
//
// The route picks Groq only when a key is set; otherwise it uses the
// demo provider. Nothing here ever reads a key from anywhere except
// the environment.

import { kbPassages, type KbPassage } from "./kb";
import { searchKb } from "./retrieval";

export type LlmAnswer = {
  answer: string;
  citations: string[];
  // True when a knowledge base passage matched the question.
  matched: boolean;
  mode: "demo" | "live";
};

export type LlmProvider = {
  name: "demo" | "groq";
  generate: (question: string, passages: KbPassage[]) => Promise<LlmAnswer>;
};

export const demoProvider: LlmProvider = {
  name: "demo",
  generate: async (question, passages) => {
    const results = searchKb(question, passages, 1);
    if (results.length === 0) {
      return {
        answer:
          "I couldn't find an answer to that in the ClientDesk help pages. Try rephrasing your question.",
        citations: [],
        matched: false,
        mode: "demo",
      };
    }
    const best = results[0].passage;
    return {
      answer: best.body,
      citations: [best.source],
      matched: true,
      mode: "demo",
    };
  },
};

const groqEndpoint = "https://api.groq.com/openai/v1/chat/completions";

// The model used for live answers. Overridable with GROQ_MODEL; the
// default is a model on Groq's free tier.
function groqModel(): string {
  return process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
}

function groqSystemPrompt(passages: KbPassage[]): string {
  const context = passages
    .map(
      (passage) =>
        `Source: ${passage.source}\nTitle: ${passage.title}\n${passage.body}`,
    )
    .join("\n\n");
  return (
    "You are the ClientDesk support agent. Answer the user's question " +
    "using ONLY the help passages below. If the passages do not answer " +
    "the question, say you could not find an answer and suggest " +
    "rephrasing. Never invent features, prices, or steps. End your " +
    "answer with a line listing the sources you used, using their exact " +
    "source names from the passages.\n\n" +
    context
  );
}

export const groqProvider: LlmProvider = {
  name: "groq",
  generate: async (question, passages) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not set.");
    }

    // No passages means nothing to ground an answer in, so the live
    // model is never asked — the caller gets the honest no-match.
    if (passages.length === 0) {
      return {
        answer:
          "I couldn't find an answer to that in the ClientDesk help pages. Try rephrasing your question.",
        citations: [],
        matched: false,
        mode: "live",
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch(groqEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: groqModel(),
          messages: [
            { role: "system", content: groqSystemPrompt(passages) },
            { role: "user", content: question },
          ],
          temperature: 0,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Groq API returned ${response.status}.`);
      }

      const data = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = data.choices?.[0]?.message?.content?.trim() ?? "";
      if (!text) {
        throw new Error("Groq API returned an empty answer.");
      }

      // Keep only sources the model named that were actually in the
      // passages it was given. Anything else is a hallucination.
      const knownSources = new Set(passages.map((p) => p.source));
      const citations = [...knownSources].filter((source) =>
        text.includes(source),
      );

      return { answer: text, citations, matched: true, mode: "live" };
    } finally {
      clearTimeout(timeout);
    }
  },
};

// The provider for a question: Groq when a key is set, demo otherwise.
// Exported as a function (not a cached value) so tests can flip the
// environment between cases.
export function getProvider(): LlmProvider {
  return process.env.GROQ_API_KEY ? groqProvider : demoProvider;
}

// Answer a question end to end: retrieve passages, then let the
// active provider answer from them. If the live provider fails for
// any reason, fall back to the demo answer instead of failing the
// chat — the user still gets a true answer from the help pages.
export async function answerQuestion(question: string): Promise<LlmAnswer> {
  const passages = searchKb(question, kbPassages, 3).map((r) => r.passage);
  const provider = getProvider();

  if (provider.name === "demo" || passages.length === 0) {
    return demoProvider.generate(question, kbPassages);
  }

  try {
    return await groqProvider.generate(question, passages);
  } catch {
    return demoProvider.generate(question, kbPassages);
  }
}
