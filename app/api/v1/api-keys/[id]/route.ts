import { NextRequest } from "next/server";
import { requireAuth, requireTenantAccess } from "@/server/auth/context";
import { prisma } from "@/lib/db/prisma";
import { EncryptionService } from "@/lib/encryption/encryption.service";
import { AuditService } from "@/server/audit/audit.service";
import { apiSuccess, apiError, AppError } from "@/lib/errors/app-error";
import { ApiKeyStatus } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: keyId } = await params;
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const { tenantId } = await requireTenantAccess();

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        ...(!isSuperAdmin && tenantId ? { tenantId } : {}),
      },
    });

    if (!apiKey) {
      throw new AppError("API Key not found", "NOT_FOUND", 404);
    }

    let fullKey = apiKey.keyPrefix + "••••••••";
    if (apiKey.scopes && typeof apiKey.scopes === "object") {
      const sObj = apiKey.scopes as any;
      if (sObj.enc) {
        fullKey = EncryptionService.decrypt(sObj.enc) || fullKey;
      }
    }

    return apiSuccess({
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      rawKey: fullKey,
      status: apiKey.status,
      createdAt: apiKey.createdAt,
    });
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: keyId } = await params;
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const { tenantId } = await requireTenantAccess();

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        ...(!isSuperAdmin && tenantId ? { tenantId } : {}),
      },
    });

    if (!apiKey) {
      throw new AppError("API Key not found", "NOT_FOUND", 404);
    }

    const url = new URL(req.url);
    const hardDelete =
      url.searchParams.get("hard") === "true" ||
      url.searchParams.get("permanent") === "true";

    if (hardDelete) {
      await prisma.apiKey.delete({
        where: { id: keyId },
      });

      AuditService.log({
        tenantId: apiKey.tenantId,
        actorUserId: user.userId,
        action: "API_KEY_DELETED",
        entityType: "ApiKey",
        entityId: keyId,
        metadata: { keyPrefix: apiKey.keyPrefix, name: apiKey.name },
      });

      return apiSuccess({ message: "API Key deleted permanently" });
    } else {
      const updated = await prisma.apiKey.update({
        where: { id: keyId },
        data: {
          status: ApiKeyStatus.REVOKED,
          revokedAt: new Date(),
        },
      });

      AuditService.log({
        tenantId: apiKey.tenantId,
        actorUserId: user.userId,
        action: "API_KEY_REVOKED",
        entityType: "ApiKey",
        entityId: keyId,
        metadata: { keyPrefix: apiKey.keyPrefix, name: apiKey.name },
      });

      return apiSuccess({ message: "API Key revoked successfully", key: updated });
    }
  } catch (err) {
    return apiError(err);
  }
}
