-- Store how each message was produced (demo | live) so reopening a
-- conversation keeps the chat page's label honest. Old rows default
-- to demo; new agent messages store the real mode.
ALTER TABLE "Message" ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'demo';
