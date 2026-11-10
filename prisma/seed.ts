// Seeds the knowledge base passages into the database.
//
// Run with `npm run db:seed` (needs DATABASE_URL). It upserts by id,
// so running it twice does not duplicate rows — it just refreshes the
// text from src/lib/kb.ts.

import { PrismaClient } from "@prisma/client";

import { kbPassages } from "@/lib/kb";

const prisma = new PrismaClient();

async function main() {
  for (const passage of kbPassages) {
    await prisma.kbPassage.upsert({
      where: { id: passage.id },
      update: {
        title: passage.title,
        body: passage.body,
        source: passage.source,
        keywords: passage.keywords,
      },
      create: {
        id: passage.id,
        title: passage.title,
        body: passage.body,
        source: passage.source,
        keywords: passage.keywords,
      },
    });
  }
  console.log(`Seeded ${kbPassages.length} knowledge base passages.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
