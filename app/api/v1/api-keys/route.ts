import { NextRequest } from "next/server";
import { requireAuth, requireTenantAccess } from "@/server/auth/context";
import { prisma } from "@/lib/db/prisma";
import { EncryptionService } from "@/lib/encryption/encryption.service";
import { AuditService } from "@/server/audit/audit.service";
import { apiSuccess, apiError, AppError } from "@/lib/errors/app-error";
import { ApiKeyStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const isSuperAdmin = user.role === "SUPER_ADMIN";

    let keys: any[] = [];
    let stats: any = {};

    if (isSuperAdmin) {
      // Super Admin: Fetch all platform keys
      const [allKeys, totalCount, activeCount, revokedCount] = await Promise.all([
        prisma.apiKey.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            agent: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            creator: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        }),
        prisma.apiKey.count(),
        prisma.apiKey.count({ where: { status: ApiKeyStatus.ACTIVE } }),
        prisma.apiKey.count({ where: { status: ApiKeyStatus.REVOKED } }),
      ]);

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const createdThisMonth = await prisma.apiKey.count({
        where: { createdAt: { gte: firstDayOfMonth } },
      });

      stats = {
        totalKeys: totalCount,
        activeKeys: activeCount,
        revokedKeys: revokedCount,
        createdThisMonth,
      };

      keys = allKeys.map((k) => {
        let rawKey: string | undefined = undefined;
        if (k.scopes && typeof k.scopes === "object") {
          const sObj = k.scopes as any;
          if (sObj.enc) {
            rawKey = EncryptionService.decrypt(sObj.enc);
          }
        }

        return {
          id: k.id,
          name: k.name,
          keyPrefix: k.keyPrefix,
          rawKey: rawKey || `${k.keyPrefix}••••••••••••••••••••••••`,
          status: k.status,
          scopes: k.scopes,
          expiresAt: k.expiresAt,
          lastUsedAt: k.lastUsedAt,
          createdAt: k.createdAt,
          revokedAt: k.revokedAt,
          agent: k.agent,
          tenant: k.tenant,
          creator: k.creator || { fullName: "System Admin", email: "admin@brainplug.ai" },
        };
      });
    } else {
      // Client / Tenant: Fetch only their organization keys
      const { tenantId } = await requireTenantAccess();

      const [tenantKeys, totalCount, activeCount] = await Promise.all([
        prisma.apiKey.findMany({
          where: { tenantId },
          orderBy: { createdAt: "desc" },
          include: {
            agent: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
            creator: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        }),
        prisma.apiKey.count({ where: { tenantId } }),
        prisma.apiKey.count({ where: { tenantId, status: ApiKeyStatus.ACTIVE } }),
      ]);

      const distinctAgentsWithKeys = new Set(tenantKeys.map((k) => k.agentId)).size;

      stats = {
        totalKeys: totalCount,
        activeKeys: activeCount,
        revokedKeys: totalCount - activeCount,
        connectedAgents: distinctAgentsWithKeys,
      };

      keys = await Promise.all(
        tenantKeys.map(async (k) => {
          let rawKey: string | undefined = undefined;
          if (k.scopes && typeof k.scopes === "object") {
            const sObj = k.scopes as any;
            if (sObj.enc) {
              rawKey = EncryptionService.decrypt(sObj.enc);
            }
          }

          if (!rawKey && k.status === ApiKeyStatus.ACTIVE) {
            const generated = EncryptionService.generateApiKey("ak_live");
            const enc = EncryptionService.encrypt(generated.rawKey);
            await prisma.apiKey.update({
              where: { id: k.id },
              data: {
                keyHash: generated.keyHash,
                keyPrefix: generated.keyPrefix,
                scopes: {
                  list: Array.isArray(k.scopes) ? k.scopes : ["chat:write"],
                  enc,
                },
              },
            });
            rawKey = generated.rawKey;
            k.keyPrefix = generated.keyPrefix;
          }

          return {
            id: k.id,
            name: k.name,
            keyPrefix: k.keyPrefix,
            rawKey: rawKey || `${k.keyPrefix}••••••••••••••••••••••••`,
            status: k.status,
            scopes: k.scopes,
            expiresAt: k.expiresAt,
            lastUsedAt: k.lastUsedAt,
            createdAt: k.createdAt,
            revokedAt: k.revokedAt,
            agent: k.agent,
            creator: k.creator || { fullName: user.fullName || "User", email: user.email },
          };
        })
      );
    }

    return apiSuccess({ stats, keys });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const { tenantId } = await requireTenantAccess();

    const body = await req.json();
    const { agentId, name, expiresInDays } = body;

    if (!agentId) {
      throw new AppError("Agent ID is required", "VALIDATION_ERROR", 400);
    }

    if (!name || !name.trim()) {
      throw new AppError("Key Name is required", "VALIDATION_ERROR", 400);
    }

    // Verify agent belongs to tenant or exists for Super Admin
    const agent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        ...(!isSuperAdmin && tenantId ? { tenantId } : {}),
      },
    });

    if (!agent) {
      throw new AppError("Agent not found in this organization", "NOT_FOUND", 404);
    }

    const effectiveTenantId = agent.tenantId || tenantId;

    const { rawKey, keyPrefix, keyHash } = EncryptionService.generateApiKey("ak_live");
    const encryptedKey = EncryptionService.encrypt(rawKey);

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const apiKey = await prisma.apiKey.create({
      data: {
        tenantId: effectiveTenantId,
        agentId,
        name: name.trim(),
        keyPrefix,
        keyHash,
        status: ApiKeyStatus.ACTIVE,
        scopes: {
          list: ["chat:write"],
          enc: encryptedKey,
        },
        expiresAt,
        createdById: user.userId,
      },
    });

    AuditService.log({
      tenantId: effectiveTenantId,
      actorUserId: user.userId,
      action: "API_KEY_CREATED",
      entityType: "ApiKey",
      entityId: apiKey.id,
      metadata: { name: apiKey.name, agentName: agent.name },
    });

    return apiSuccess(
      {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        rawKey,
        createdAt: apiKey.createdAt,
      },
      undefined,
      201
    );
  } catch (err) {
    return apiError(err);
  }
}
