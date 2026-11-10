// Keyword search over the knowledge base.
//
// This is plain keyword retrieval, not embeddings: a passage scores
// for each question word it contains, with title words counting most.
// It is small and honest about what it does, and it needs no database
// or network — the passages live in src/lib/kb.ts.

import type { KbPassage } from "./kb";

// Common words that carry no meaning for matching. Kept short on
// purpose: anything not listed here still counts.
const stopwords = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "to",
  "of",
  "in",
  "on",
  "for",
  "with",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "how",
  "do",
  "does",
  "did",
  "can",
  "could",
  "i",
  "my",
  "me",
  "you",
  "your",
  "it",
  "its",
  "this",
  "that",
  "what",
  "when",
  "where",
  "why",
  "please",
  "help",
  "am",
  "an",
  // Time words: they say when, never what the question is about, and
  // several passages use "today" ("does not work today"), so without
  // this an unrelated question containing "today" would match them.
  "today",
  "tomorrow",
  "yesterday",
  "yet",
  "still",
  "now",
]);

// Lowercase, split on anything that is not a letter or digit, and drop
// stopwords and single letters.
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 1 && !stopwords.has(word));
}

// Score one passage against the question words. A word in the title
// counts 3, in the keywords 2, in the body 1. Each word counts once
// per field, so a long body cannot win by repeating a word.
export function scorePassage(
  questionWords: string[],
  passage: KbPassage,
): number {
  const titleWords = new Set(tokenize(passage.title));
  const keywordWords = new Set(passage.keywords.flatMap(tokenize));
  const bodyWords = new Set(tokenize(passage.body));

  let score = 0;
  for (const word of new Set(questionWords)) {
    if (titleWords.has(word)) score += 3;
    if (keywordWords.has(word)) score += 2;
    if (bodyWords.has(word)) score += 1;
  }
  return score;
}

export type SearchResult = {
  passage: KbPassage;
  score: number;
};

// Return the best matching passages, highest score first. An empty
// list means nothing matched — the caller treats that as "I don't
// know, offer a ticket" instead of inventing an answer.
export function searchKb(
  query: string,
  passages: KbPassage[],
  limit = 3,
): SearchResult[] {
  const questionWords = tokenize(query);
  if (questionWords.length === 0) return [];

  return passages
    .map((passage) => ({ passage, score: scorePassage(questionWords, passage) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
