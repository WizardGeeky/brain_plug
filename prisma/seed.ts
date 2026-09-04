import { PrismaClient, UserStatus, OtpPurpose } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting production-grade seed script for Brain Plug...");

  // 1. Seed Permissions Registry
  console.log("Seeding system permissions...");
  const permissions = [
    // Super Admin Permissions
    { code: "platform:manage", module: "PLATFORM", description: "Full super admin control over entire platform" },
    { code: "tenants:read", module: "TENANTS", description: "View all client tenants" },
    { code: "tenants:write", module: "TENANTS", description: "Create, update, suspend, delete client tenants" },
    { code: "models:manage", module: "MODELS", description: "Configure and publish Gemini models registry" },
    { code: "analytics:platform", module: "ANALYTICS", description: "View platform-wide usage metrics and revenue" },
    { code: "audit:view", module: "AUDIT", description: "Inspect system audit trail" },

    // Tenant / Client Admin Permissions
    { code: "agents:read", module: "AGENTS", description: "View tenant AI agents" },
    { code: "agents:write", module: "AGENTS", description: "Create, configure, publish, and delete AI agents" },
    { code: "documents:upload", module: "KNOWLEDGE", description: "Upload and ingest files into RAG knowledge base" },
    { code: "documents:delete", module: "KNOWLEDGE", description: "Remove documents and embeddings from knowledge base" },
    { code: "api_keys:manage", module: "SECURITY", description: "Generate and revoke agent API keys" },
    { code: "widget:configure", module: "WIDGET", description: "Customize chat widget appearance and domain security" },
    { code: "conversations:read", module: "CONVERSATIONS", description: "Read user conversation logs and citations" },
    { code: "analytics:tenant", module: "ANALYTICS", description: "View tenant-level token consumption and traffic" },
    { code: "users:manage", module: "USERS", description: "Invite and manage team members within tenant" },
    { code: "tenant:settings", module: "SETTINGS", description: "Configure organization settings and branding" },

    // Client User (Read-Only) Permissions
    { code: "chat:test", module: "CHAT", description: "Interact with AI agents in test console" },
  ];

  const createdPermissions: Record<string, any> = {};
  for (const p of permissions) {
    const perm = await prisma.permission.upsert({
      where: { code: p.code },
      update: {
        module: p.module,
        description: p.description,
      },
      create: {
        code: p.code,
        module: p.module,
        description: p.description,
      },
    });
    createdPermissions[p.code] = perm;
  }

  // 2. Seed System Roles
  console.log("Seeding system roles...");
  const superAdminRole = await prisma.role.upsert({
    where: { name: "SUPER_ADMIN" },
    update: { description: "Full platform owner with complete administrative access" },
    create: {
      name: "SUPER_ADMIN",
      description: "Full platform owner with complete administrative access",
      isSystem: true,
    },
  });

  const clientAdminRole = await prisma.role.upsert({
    where: { name: "CLIENT_ADMIN" },
    update: { description: "Administrator of a specific client tenant workspace" },
    create: {
      name: "CLIENT_ADMIN",
      description: "Administrator of a specific client tenant workspace",
      isSystem: true,
    },
  });

  const clientUserRole = await prisma.role.upsert({
    where: { name: "CLIENT_USER" },
    update: { description: "Member of a client tenant workspace with testing & viewing rights" },
    create: {
      name: "CLIENT_USER",
      description: "Member of a client tenant workspace with testing & viewing rights",
      isSystem: true,
    },
  });

  // 3. Attach Permissions to Roles
  console.log("Mapping role permissions...");
  for (const perm of Object.values(createdPermissions)) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: perm.id,
      },
    });
  }

  const clientAdminPermCodes = [
    "agents:read",
    "agents:write",
    "documents:upload",
    "documents:delete",
    "api_keys:manage",
    "widget:configure",
    "conversations:read",
    "analytics:tenant",
    "users:manage",
    "tenant:settings",
    "chat:test",
  ];
  for (const code of clientAdminPermCodes) {
    if (createdPermissions[code]) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: clientAdminRole.id,
            permissionId: createdPermissions[code].id,
          },
        },
        update: {},
        create: {
          roleId: clientAdminRole.id,
          permissionId: createdPermissions[code].id,
        },
      });
    }
  }

  const clientUserPermCodes = ["agents:read", "chat:test", "conversations:read"];
  for (const code of clientUserPermCodes) {
    if (createdPermissions[code]) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: clientUserRole.id,
            permissionId: createdPermissions[code].id,
          },
        },
        update: {},
        create: {
          roleId: clientUserRole.id,
          permissionId: createdPermissions[code].id,
        },
      });
    }
  }

  // 4. Seed Default Super Admin
  console.log("Checking for existing Super Admin in database...");
  const adminEmail = (process.env.DEFAULT_ADMIN_EMAIL || "eswar.crypto.tech@gmail.com").toLowerCase().trim();

  let superAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!superAdmin) {
    console.log(`Creating default Super Admin: ${adminEmail}...`);
    superAdmin = await prisma.user.create({
      data: {
        fullName: process.env.DEFAULT_ADMIN_FULL_NAME || "Eswar",
        email: adminEmail,
        mobile: process.env.DEFAULT_ADMIN_MOBILE || "+1234567890",
        gender: process.env.DEFAULT_ADMIN_GENDER || "MALE",
        location: process.env.DEFAULT_ADMIN_LOCATION || "India",
        status: UserStatus.ACTIVE,
        emailVerified: true,
        mobileVerified: true,
      },
    });
  }

  const existingAdminRole = await prisma.userTenantRole.findFirst({
    where: {
      userId: superAdmin.id,
      roleId: superAdminRole.id,
      tenantId: null,
    },
  });

  if (!existingAdminRole) {
    await prisma.userTenantRole.create({
      data: {
        userId: superAdmin.id,
        roleId: superAdminRole.id,
        tenantId: null,
      },
    });
    console.log(`✅ Default Super Admin created: ${adminEmail} (Passwordless OTP)`);
  } else {
    console.log(`ℹ️ User ${adminEmail} exists. Assigning Super Admin role.`);
  }

  console.log("✅ Seed completed successfully! (Super Admin and Roles/Permissions Only)");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
