import { prisma } from "../lib/db/prisma";

async function main() {
  const chunks = await prisma.documentChunk.findMany({
    where: { agentId: "7135bad7-5eee-4362-861f-71e981649afd" },
    include: { document: true },
  });

  console.log(`Found ${chunks.length} chunks:`);
  for (const c of chunks) {
    console.log(`--- Doc: ${c.document.originalFileName} (Chunk ${c.chunkIndex}) ---`);
    console.log(c.content);
    console.log("Vector length:", (c.embedding as any[])?.length);
  }
}

main().finally(() => prisma.$disconnect());
