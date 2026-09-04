import { NextRequest } from "next/server";
import { requireAuth, requireTenantAccess } from "@/server/auth/context";
import { prisma } from "@/lib/db/prisma";
import { EncryptionService } from "@/lib/encryption/encryption.service";
import { createApiKeySchema } from "@/schemas/chat.schema";
import { AuditService } from "@/server/audit/audit.service";
import { apiSuccess, apiError } from "@/lib/errors/app-error";
import { ApiKeyStatus } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const { tenantId } = await requireTenantAccess();

    let keys = await prisma.apiKey.findMany({
      where: {
        agentId,
        ...(tenantId ? { tenantId } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    if (keys.length === 0) {
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        select: { tenantId: true },
      });
      const effectiveTenantId = tenantId || agent?.tenantId;
      if (effectiveTenantId) {
        const { rawKey, keyPrefix, keyHash } = EncryptionService.generateApiKey("ak_live");
        const encryptedKey = EncryptionService.encrypt(rawKey);
        const newKey = await prisma.apiKey.create({
          data: {
            tenantId: effectiveTenantId,
            agentId,
            name: "Default Widget Key",
            keyPrefix,
            keyHash,
            status: ApiKeyStatus.ACTIVE,
            scopes: {
              list: ["chat:write"],
              enc: encryptedKey,
            },
          },
        });
        keys = [newKey];
      }
    }

    const enrichedKeys = await Promise.all(
      keys.map(async (k) => {
        let rawKey: string | undefined = undefined;

        if (k.scopes && typeof k.scopes === "object") {
          const sObj = k.scopes as any;
          if (sObj.enc) {
            rawKey = EncryptionService.decrypt(sObj.enc);
          }
        }

        // If legacy key without encrypted raw string, generate and persist one so View Key & Copy always work
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
          hasEncryptedKey: Boolean(rawKey),
          status: k.status,
          expiresAt: k.expiresAt,
          lastUsedAt: k.lastUsedAt,
          createdAt: k.createdAt,
        };
      })
    );

    return apiSuccess(enrichedKeys);
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: agentId } = await params;
    const { tenantId } = await requireTenantAccess();

    const body = await req.json();
    const validated = createApiKeySchema.parse(body);

    const { rawKey, keyPrefix, keyHash } = EncryptionService.generateApiKey("ak_live");
    const encryptedKey = EncryptionService.encrypt(rawKey);

    const expiresAt = validated.expiresInDays
      ? new Date(Date.now() + validated.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const apiKey = await prisma.apiKey.create({
      data: {
        tenantId,
        agentId,
        name: validated.name,
        keyPrefix,
        keyHash,
        status: ApiKeyStatus.ACTIVE,
        scopes: {
          list: validated.scopes || ["chat:write"],
          enc: encryptedKey,
        },
        expiresAt,
        createdById: user.userId,
      },
    });

    AuditService.log({
      tenantId,
      actorUserId: user.userId,
      action: "API_KEY_CREATED",
      entityType: "ApiKey",
      entityId: apiKey.id,
      metadata: { name: apiKey.name, keyPrefix },
    });

    return apiSuccess(
      {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        rawSecretKey: rawKey,
        rawKey: rawKey,
        scopes: apiKey.scopes,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
      },
      undefined,
      201
    );
  } catch (err) {
    return apiError(err);
  }
}
