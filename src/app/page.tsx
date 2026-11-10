// Placeholder home page for M1. The knowledge base and its search are
// built and tested; the chat UI lands in M2, so for now the page just
// says where the project stands instead of pretending to be the app.
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">ClientDesk Support Agent</h1>
      <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">
        A support agent for ClientDesk users. All six milestones are
        done: the chat answers from the knowledge base, tickets go to a
        human in the admin inbox, and analytics and scripted evals keep
        the answers honest.
      </p>
      <a
        className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        href="/chat"
      >
        Ask the support agent
      </a>
      <a
        className="text-sm font-medium underline"
        href="https://github.com/MuhammadAhmad67889/clientdesk"
      >
        ClientDesk on GitHub
      </a>
    </main>
  );
}
