import { AgentService } from "../services/agent/agent.service";
import { prisma } from "../lib/db/prisma";
import { WidgetService } from "../services/widget/widget.service";

async function main() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error("No tenant found");

  const model = await prisma.geminiModel.findFirst({
    where: { status: "ACTIVE", isPublished: true },
  });
  if (!model) throw new Error("No active Gemini model found");

  console.log("Using Tenant:", tenant.name, tenant.id);
  console.log("Using Model:", model.displayName, model.id);

  // 1. Create new agent with host address
  const testAgent = await AgentService.createAgent({
    tenantId: tenant.id,
    name: "Automated Test Agent",
    description: "Testing host address and CORS isolation",
    systemPrompt: "You are a test AI assistant.",
    welcomeMessage: "Hello from test agent!",
    geminiModelId: model.id,
    hostAddress: "localhost:3001, test.myorg.com",
  });

  console.log("\nCreated Agent:", {
    id: testAgent.id,
    name: testAgent.name,
    status: testAgent.status,
  });

  // 2. Verify AllowedDomain records
  const allowed = await prisma.allowedDomain.findMany({
    where: { agentId: testAgent.id },
  });
  console.log("Allowed Domains in DB:", allowed.map(d => d.domain));

  // 3. Test Widget Auth from allowed origin (localhost:3001)
  const authAllowed = await WidgetService.validateWidgetAuth(
    testAgent.id,
    null,
    "http://localhost:3001"
  );
  console.log("Auth from localhost:3001:", authAllowed ? "ALLOWED ✅" : "FAILED");

  // 4. Test Widget Auth from unauthorized origin (attacker.com)
  let blocked = false;
  try {
    await WidgetService.validateWidgetAuth(
      testAgent.id,
      null,
      "https://attacker.com"
    );
  } catch (err: any) {
    blocked = true;
    console.log("Auth from attacker.com:", `BLOCKED with error: "${err.message}" ✅`);
  }

  if (!blocked) {
    throw new Error("Security check failed: attacker.com was not blocked!");
  }

  // Clean up test agent
  await prisma.allowedDomain.deleteMany({ where: { agentId: testAgent.id } });
  await prisma.agentWidgetConfig.deleteMany({ where: { agentId: testAgent.id } });
  await prisma.agent.delete({ where: { id: testAgent.id } });
  console.log("\nTest Agent cleaned up successfully!");

  console.log("\n✅ All Agent Creation & Host Address tests PASSED!");
}

main().finally(() => prisma.$disconnect());
