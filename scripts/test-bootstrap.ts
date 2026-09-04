import { BootstrapService } from "../services/bootstrap/bootstrap.service";
import { prisma } from "../lib/db/prisma";

async function main() {
  console.log("Running BootstrapService.ensureDefaults()...");
  await BootstrapService.ensureDefaults();

  const permissions = await prisma.permission.count();
  const roles = await prisma.role.count();
  const rolePermissions = await prisma.rolePermission.count();
  const models = await prisma.geminiModel.findMany({ select: { modelName: true, displayName: true, isPublished: true, status: true } });
  const admin = await prisma.user.findUnique({ where: { email: "eswar.crypto.tech@gmail.com" }, include: { tenantRoles: true } });

  console.log("Bootstrap Results:", {
    permissions,
    roles,
    rolePermissions,
    models,
    admin: {
      email: admin?.email,
      rolesCount: admin?.tenantRoles.length,
    },
  });
}

main().finally(() => prisma.$disconnect());
