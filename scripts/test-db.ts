import { prisma } from "../lib/db/prisma";

async function main() {
  try {
    const users = await prisma.user.count();
    const roles = await prisma.role.count();
    const perms = await prisma.permission.count();
    const rolePerms = await prisma.rolePermission.count();
    const models = await prisma.geminiModel.findMany();
    const tenants = await prisma.tenant.findMany();
    const agents = await prisma.agent.findMany({
      include: {
        allowedDomains: true,
        apiKeys: true,
        documents: true,
      },
    });
    const settings = await prisma.platformSetting.findMany();

    console.log(JSON.stringify({
      counts: { users, roles, perms, rolePerms },
      models,
      tenants: tenants.map(t => ({ id: t.id, name: t.name, slug: t.slug })),
      agents: agents.map(a => ({
        id: a.id,
        name: a.name,
        tenantId: a.tenantId,
        modelId: a.geminiModelId,
        status: a.status,
        allowedDomains: a.allowedDomains,
        apiKeys: a.apiKeys.map(k => ({ id: k.id, name: k.name, keyPrefix: k.keyPrefix, status: k.status })),
        documentsCount: a.documents.length,
      })),
      settings,
    }, null, 2));
  } catch (err) {
    console.error("DB check failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
