// One Prisma client for the whole app.
//
// Next.js reloads modules in development, so the client is cached on
// globalThis — without this, every reload would open a new database
// connection and eventually exhaust the pool.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
