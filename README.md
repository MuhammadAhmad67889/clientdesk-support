# ClientDesk Support Agent

A support agent for people using [ClientDesk](https://github.com/MuhammadAhmad67889/clientdesk), my client and invoice manager for freelance work. A user asks a question in plain words and gets an answer drawn from the real ClientDesk help content, with the source shown. When the agent cannot answer, or the user asks for a person, it opens a ticket with the full transcript, and I answer it from an admin inbox.

## Where it stands

**M2 done:** the chat. The chat page (`/chat`) answers from the knowledge base with the demo responder, showing each answer's source, and the widget loader (`public/widget.js`) embeds it on any page. M1 (knowledge base + search) is under it: 16 passages of real ClientDesk content (`src/lib/kb.ts`), keyword search (`src/lib/retrieval.ts`), 13 tests. Tickets and the admin inbox land in M4.

## Honest rules

- The agent only answers from the knowledge base, and every answer cites its source. If nothing matches, it says so and offers a ticket. It never invents an answer.
- The knowledge base only states what ClientDesk actually does. Features that are built but not switched on yet (password-reset email, Google/GitHub sign-in, billing) say so in plain words.
- **Demo mode (default, no key needed):** answers quote the help pages verbatim and say they are demo answers.
- **Live mode:** a real LLM answer grounded in the retrieved passages. Needs a `GROQ_API_KEY` env var (Groq free tier). The key is never in chat and never committed.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # vitest
npm run lint
npx tsc --noEmit
npm run build
```

Database (needed from M2, when the app first reads/writes it):

```bash
# .env — local Postgres, same as ClientDesk
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/clientdesk_support?schema=public"
npm run db:generate   # generate the Prisma client
npm run db:migrate    # apply migrations
npm run db:seed       # seed the knowledge base passages
```

## Stack

Next.js 16 + TypeScript (strict), React 19, Tailwind v4, Prisma 6 + Postgres (Neon free in production), Vitest, GitHub Actions CI, Vercel deploy.

## Code style

Small functions with clear names, comments only where they explain why, no clever one-liners. A bug should be easy to trace.
