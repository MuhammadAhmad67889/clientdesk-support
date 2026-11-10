// Seeds the knowledge base passages and the scripted eval scenarios
// into the database.
//
// Run with `npm run db:seed` (needs DATABASE_URL). It upserts by id,
// so running it twice does not duplicate rows — it just refreshes the
// text from src/lib/kb.ts and src/lib/evals.ts.

import { PrismaClient } from "@prisma/client";

import { kbPassages } from "@/lib/kb";
import { evalScenarios } from "@/lib/evals";

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

  // Scenarios are matched by question, so a re-seed refreshes the
  // expected source without duplicating the scenario.
  for (const scenario of evalScenarios) {
    const existing = await prisma.evalScenario.findFirst({
      where: { question: scenario.question },
    });
    if (existing) {
      await prisma.evalScenario.update({
        where: { id: existing.id },
        data: { expectedSource: scenario.expectedSource },
      });
    } else {
      await prisma.evalScenario.create({
        data: {
          question: scenario.question,
          expectedSource: scenario.expectedSource,
        },
      });
    }
  }
  console.log(`Seeded ${evalScenarios.length} eval scenarios.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
