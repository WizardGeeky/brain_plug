import { NextRequest } from "next/server";
import { requireAuth, requireTenantAccess } from "@/server/auth/context";
import { prisma } from "@/lib/db/prisma";
import { AuditService } from "@/server/audit/audit.service";
import { apiSuccess, apiError, AppError } from "@/lib/errors/app-error";
import { ApiKeyStatus } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: keyId } = await params;
    const { tenantId } = await requireTenantAccess();

    const apiKey = await prisma.apiKey.findFirst({
      where: { id: keyId, tenantId },
    });

    if (!apiKey) {
      throw new AppError("API Key not found", "NOT_FOUND", 404);
    }

    const updated = await prisma.apiKey.update({
      where: { id: keyId },
      data: {
        status: ApiKeyStatus.REVOKED,
        revokedAt: new Date(),
      },
    });

    AuditService.log({
      tenantId,
      actorUserId: user.userId,
      action: "API_KEY_REVOKED",
      entityType: "ApiKey",
      entityId: keyId,
      metadata: { keyPrefix: apiKey.keyPrefix },
    });

    return apiSuccess(updated);
  } catch (err) {
    return apiError(err);
  }
}
