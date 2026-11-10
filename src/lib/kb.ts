// The knowledge base: every passage of real ClientDesk help content
// the agent is allowed to answer from.
//
// Rule: a passage may only state what ClientDesk actually does today.
// Anything built but not switched on yet (password-reset email,
// Google/GitHub sign-in, billing) says so in plain words, so the
// agent never promises a feature that does not work yet. The `source`
// of each passage is shown to the user with the answer that used it.

export type KbPassage = {
  id: string;
  title: string;
  body: string;
  source: string;
  keywords: string[];
};

export const kbPassages: KbPassage[] = [
  {
    id: "what-is-clientdesk",
    title: "What ClientDesk is",
    body: "ClientDesk is a client and invoice manager for freelance work. It keeps clients, invoices, and payments in one place instead of juggling spreadsheets.",
    source: "ClientDesk landing page",
    keywords: ["what", "about", "is", "does", "freelance", "manager"],
  },
  {
    id: "getting-started",
    title: "Getting started",
    body: "Sign up with an email and password. A new account starts with demo data: 3 clients and 5 invoices, so you can try everything right away. The dashboard has a Reset demo data button that restores that demo data.",
    source: "ClientDesk signup and dashboard",
    keywords: ["start", "sign", "up", "demo", "data", "try", "account", "create"],
  },
  {
    id: "free-plan-limits",
    title: "Free plan limits",
    body: "The Free plan allows 10 clients and 30 invoices. The demo rows that come with a new account count toward those limits.",
    source: "ClientDesk pricing page",
    keywords: ["free", "plan", "limit", "clients", "invoices", "10", "30"],
  },
  {
    id: "pro-business-pricing",
    title: "Pro and Business pricing",
    body: "Pro is planned at $9 per month and Business at $19 per month, but billing is not set up yet, so you cannot pay or upgrade inside the app today.",
    source: "ClientDesk pricing page",
    keywords: ["pro", "business", "price", "pricing", "pay", "upgrade", "cost", "subscription", "month"],
  },
  {
    id: "add-client",
    title: "Add and manage clients",
    body: "On the Clients page you can add a client, edit their details, and archive clients you no longer work with. You can also import clients from a CSV file and export your clients as CSV.",
    source: "ClientDesk clients page",
    keywords: ["client", "add", "edit", "archive", "import", "export", "csv"],
  },
  {
    id: "create-invoice",
    title: "Create an invoice",
    body: "On the Invoices page you can create an invoice with line items, set tax and discount rates, and edit or duplicate it afterwards. Each invoice gets a number.",
    source: "ClientDesk invoices page",
    keywords: ["invoice", "create", "line", "items", "tax", "discount", "number", "duplicate", "edit"],
  },
  {
    id: "invoice-pdf",
    title: "Download an invoice as PDF",
    body: "Every invoice can be downloaded as a one-page PDF from the invoice page. The PDF shows the invoice details, line items, and payment history.",
    source: "ClientDesk invoice page",
    keywords: ["pdf", "download", "invoice", "export", "print"],
  },
  {
    id: "record-payment",
    title: "Record a payment",
    body: "On an invoice you can record a payment, including a partial payment. The invoice shows how much is paid and how much is still outstanding, and you can delete a payment you recorded by mistake.",
    source: "ClientDesk invoice page",
    keywords: ["payment", "pay", "partial", "paid", "record", "outstanding", "balance", "delete"],
  },
  {
    id: "recurring-invoices",
    title: "Recurring invoices",
    body: "You can set an invoice to repeat automatically as a recurring invoice, so regular billing does not need to be created by hand each time.",
    source: "ClientDesk invoices page",
    keywords: ["recurring", "repeat", "automatic", "regular", "monthly"],
  },
  {
    id: "export-clients-csv",
    title: "Export clients as CSV",
    body: "On the Clients page you can export your clients as a CSV file, including how much each client has paid and how much they still owe.",
    source: "ClientDesk clients page",
    keywords: ["export", "csv", "clients", "download", "spreadsheet"],
  },
  {
    id: "dashboard-totals",
    title: "Dashboard totals",
    body: "The dashboard shows your total paid, total outstanding, and overdue invoices, plus a monthly overview of the last 6 months.",
    source: "ClientDesk dashboard",
    keywords: ["dashboard", "total", "paid", "outstanding", "overdue", "overview", "monthly"],
  },
  {
    id: "change-password",
    title: "Change your password",
    body: "You can change your password in Settings. It asks for your current password and the new one.",
    source: "ClientDesk settings page",
    keywords: ["password", "change", "settings", "update"],
  },
  {
    id: "forgot-password",
    title: "Forgot your password",
    body: "Password reset is built but not switched on yet: the app cannot send you a reset email today. If you are signed in, you can still change your password in Settings.",
    source: "ClientDesk auth pages",
    keywords: ["forgot", "password", "reset", "email", "locked", "cannot", "sign", "in"],
  },
  {
    id: "google-github-signin",
    title: "Sign in with Google or GitHub",
    body: "Google and GitHub sign-in are built but not switched on yet, so signing in with them does not work today. Signing up and signing in with an email and password works.",
    source: "ClientDesk auth pages",
    keywords: ["google", "github", "sign", "in", "oauth", "login"],
  },
  {
    id: "export-delete-data",
    title: "Export your data or delete your account",
    body: "In Settings you can export all of your data, and you can delete your account yourself. Deleting an account permanently removes your data and cannot be undone.",
    source: "ClientDesk settings page",
    keywords: ["export", "data", "delete", "account", "remove", "download"],
  },
  {
    id: "contact-support",
    title: "Contact support",
    body: "You can reach the ClientDesk team at muhammadahmad.codes@gmail.com.",
    source: "ClientDesk terms and privacy pages",
    keywords: ["contact", "support", "email", "help", "team", "reach"],
  },
];
