import { NextRequest } from "next/server";
import { requireRole } from "@/server/auth/context";
import { prisma } from "@/lib/db/prisma";
import { AuditService } from "@/server/audit/audit.service";
import { apiSuccess, apiError } from "@/lib/errors/app-error";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireRole("SUPER_ADMIN");
    const { id } = await params;

    const model = await prisma.geminiModel.update({
      where: { id },
      data: { isPublished: false },
    });

    AuditService.log({
      actorUserId: actor.userId,
      action: "MODEL_UNPUBLISHED",
      entityType: "GeminiModel",
      entityId: model.id,
      metadata: { modelName: model.modelName },
    });

    return apiSuccess(model);
  } catch (err) {
    return apiError(err);
  }
}
