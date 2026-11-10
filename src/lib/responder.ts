// The demo responder: answers a question from the knowledge base.
//
// Kept as a small wrapper around the demo provider (src/lib/llm.ts)
// so the chat route and the tests have one simple function to call.
// Demo mode needs no API key and generates no text: when the search
// finds a passage, the answer IS that passage, quoted word for word,
// with its source. When nothing matches, the answer says so plainly
// instead of inventing one — that "I don't know" is what becomes a
// ticket in M4.

import { demoProvider, type LlmAnswer } from "./llm";
import { kbPassages } from "./kb";

export type { LlmAnswer };

export function respondToQuestion(question: string): Promise<LlmAnswer> {
  return demoProvider.generate(question, kbPassages);
}
