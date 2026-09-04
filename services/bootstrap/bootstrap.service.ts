import { prisma } from "@/lib/db/prisma";
import { UserStatus, ModelStatus } from "@prisma/client";
import { Logger } from "@/lib/logger/logger";

export class BootstrapService {
  private static isInitialized = false;

  /**
   * Run idempotent system bootstrap on server start
   * Creates default permissions, roles, role-permission mappings,
   * default Super Admin, Gemini models registry, and platform settings.
   */
  public static async ensureDefaults(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 1. Seed / Ensure Permissions Registry
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

      // 2. Ensure System Roles Exist
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

      // 4. Ensure Super Admin User Exists
      const adminEmail = (process.env.DEFAULT_ADMIN_EMAIL || "eswar.crypto.tech@gmail.com")
        .toLowerCase()
        .trim();

      let superAdmin = await prisma.user.findUnique({
        where: { email: adminEmail },
      });

      if (!superAdmin) {
        superAdmin = await (prisma.user.create as any)({
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

      if (superAdmin) {
        // 5. Ensure Super Admin Role Assignment
        const existingRole = await prisma.userTenantRole.findFirst({
          where: {
            userId: superAdmin.id,
            roleId: superAdminRole.id,
            tenantId: null,
          },
        });

        if (!existingRole) {
          await prisma.userTenantRole.create({
            data: {
              userId: superAdmin.id,
              roleId: superAdminRole.id,
              tenantId: null,
            },
          });
        }
      }

      // 6. Seed Approved Default Gemini Models Registry
      const defaultModels = [
        {
          modelName: "gemini-2.0-flash",
          displayName: "Gemini 2.0 Flash",
          provider: "Google",
          description: "Next-gen ultra-fast, highly capable multimodal AI model for high-speed chat & RAG.",
          status: ModelStatus.ACTIVE,
          isPublished: true,
          inputTokenPrice: 0,
          outputTokenPrice: 0,
          maxTokens: 8192,
          supportsStreaming: true,
          supportsVision: true,
        },
        {
          modelName: "gemini-1.5-flash",
          displayName: "Gemini 1.5 Flash",
          provider: "Google",
          description: "Lightweight, cost-efficient, and fast model with high-volume performance.",
          status: ModelStatus.ACTIVE,
          isPublished: true,
          inputTokenPrice: 0,
          outputTokenPrice: 0,
          maxTokens: 8192,
          supportsStreaming: true,
          supportsVision: true,
        },
        {
          modelName: "gemini-1.5-pro",
          displayName: "Gemini 1.5 Pro",
          provider: "Google",
          description: "Advanced reasoning model for complex diagnostic and analytical tasks.",
          status: ModelStatus.ACTIVE,
          isPublished: true,
          inputTokenPrice: 0,
          outputTokenPrice: 0,
          maxTokens: 8192,
          supportsStreaming: true,
          supportsVision: true,
        },
        {
          modelName: "gemini-2.5-flash",
          displayName: "Gemini 2.5 Flash",
          provider: "Google",
          description: "Enhanced multimodal speed and reasoning engine for enterprise widgets.",
          status: ModelStatus.ACTIVE,
          isPublished: true,
          inputTokenPrice: 0,
          outputTokenPrice: 0,
          maxTokens: 8192,
          supportsStreaming: true,
          supportsVision: true,
        },
        {
          modelName: "gemini-3.6-flash",
          displayName: "Gemini Flash 3.6",
          provider: "Google",
          description: "Standard configured fast Gemini assistant model.",
          status: ModelStatus.ACTIVE,
          isPublished: true,
          inputTokenPrice: 0,
          outputTokenPrice: 0,
          maxTokens: 8192,
          supportsStreaming: true,
          supportsVision: true,
        },
      ];

      for (const m of defaultModels) {
        await prisma.geminiModel.upsert({
          where: { modelName: m.modelName },
          update: {
            displayName: m.displayName,
            description: m.description,
            status: m.status,
            isPublished: m.isPublished,
            supportsStreaming: m.supportsStreaming,
            supportsVision: m.supportsVision,
          },
          create: m,
        });
      }

      // 7. Sync GEMINI_API_KEY to platform_settings if present in .env and not in DB
      const envKey = process.env.GEMINI_API_KEY?.trim();
      if (envKey) {
        const existingSetting = await prisma.platformSetting.findUnique({
          where: { key: "gemini_api_key" },
        });
        if (!existingSetting || !(existingSetting.value as any)?.apiKey) {
          await prisma.platformSetting.upsert({
            where: { key: "gemini_api_key" },
            update: {
              value: { apiKey: envKey, updatedAt: new Date().toISOString() },
            },
            create: {
              key: "gemini_api_key",
              value: { apiKey: envKey, updatedAt: new Date().toISOString() },
            },
          });
        }
      }

      this.isInitialized = true;
      Logger.info("✅ System bootstrap completed: permissions, roles, super admin, and Gemini models synced.");
    } catch (error: any) {
      const isConnectionError =
        error?.message?.includes("Can't reach database server") ||
        error?.code === "P1001" ||
        error?.name === "PrismaClientInitializationError";

      if (isConnectionError) {
        Logger.warn(
          "⚠️ Database unreachable on startup (" +
            (process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] || "configured host") +
            "). Ensure your PostgreSQL/Supabase database is running and reachable."
        );
      } else {
        Logger.error("Error ensuring default system data on startup", error);
      }
    }
  }
}
