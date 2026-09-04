import { prisma } from "../lib/db/prisma";

async function main() {
  const agentId = "7135bad7-5eee-4362-861f-71e981649afd";
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: { allowedDomains: true, tenant: true },
  });

  if (!agent) {
    console.log("Agent not found!");
    return;
  }

  console.log(`Agent ${agent.name} (${agent.id}):`);
  console.log("Allowed domains before:", agent.allowedDomains.map(d => d.domain));

  // Ensure localhost:3001, localhost:3000, 127.0.0.1 are present
  const domainsToEnsure = ["localhost:3001", "localhost:3000", "127.0.0.1:3001", "127.0.0.1:3000"];
  for (const dom of domainsToEnsure) {
    const exists = agent.allowedDomains.some(d => d.domain === dom);
    if (!exists) {
      await prisma.allowedDomain.create({
        data: {
          agentId: agent.id,
          tenantId: agent.tenantId,
          domain: dom,
        },
      });
      console.log(`Added allowed domain: ${dom}`);
    }
  }

  const updated = await prisma.allowedDomain.findMany({ where: { agentId } });
  console.log("Allowed domains after:", updated.map(d => d.domain));
}

main().finally(() => prisma.$disconnect());
