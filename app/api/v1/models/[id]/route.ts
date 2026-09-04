import { NextRequest } from "next/server";
import { requireRole } from "@/server/auth/context";
import { prisma } from "@/lib/db/prisma";
import { updateModelSchema } from "@/schemas/model.schema";
import { AuditService } from "@/server/audit/audit.service";
import { apiSuccess, apiError, AppError } from "@/lib/errors/app-error";
import { GeminiService } from "@/services/gemini/gemini.service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireRole("SUPER_ADMIN");
    const { id } = await params;
    const body = await req.json();
    const validated = updateModelSchema.parse(body);

    if (validated.apiKey && validated.apiKey.trim().length > 0) {
      await GeminiService.setApiKey(validated.apiKey.trim());
    }

    const updated = await prisma.geminiModel.update({
      where: { id },
      data: {
        ...(validated.modelName && { modelName: validated.modelName.trim() }),
        ...(validated.displayName && { displayName: validated.displayName.trim() }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.status && {
          status: validated.status,
          isPublished: validated.status === "ACTIVE",
        }),
        ...(validated.isPublished !== undefined && { isPublished: validated.isPublished }),
        ...(validated.inputTokenPrice !== undefined && { inputTokenPrice: validated.inputTokenPrice }),
        ...(validated.outputTokenPrice !== undefined && { outputTokenPrice: validated.outputTokenPrice }),
        ...(validated.maxTokens !== undefined && { maxTokens: validated.maxTokens }),
      },
    });

    AuditService.log({
      actorUserId: actor.userId,
      action: "MODEL_UPDATED",
      entityType: "GeminiModel",
      entityId: id,
      metadata: { modelName: updated.modelName },
    });

    return apiSuccess(updated);
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireRole("SUPER_ADMIN");
    const { id } = await params;

    const model = await prisma.geminiModel.findUnique({
      where: { id },
      include: { _count: { select: { agents: true } } },
    });

    if (!model) {
      throw new AppError("Model not found", "NOT_FOUND", 404);
    }

    // If agents are assigned to this model, safely reassign or unlink them
    if (model._count.agents > 0) {
      const fallbackModel = await prisma.geminiModel.findFirst({
        where: { id: { not: id } },
        orderBy: [{ isPublished: "desc" }, { createdAt: "asc" }],
      });

      if (fallbackModel) {
        await prisma.agent.updateMany({
          where: { geminiModelId: id },
          data: { geminiModelId: fallbackModel.id },
        });
      } else {
        await prisma.agent.updateMany({
          where: { geminiModelId: id },
          data: { geminiModelId: null },
        });
      }
    }

    const deleted = await prisma.geminiModel.delete({
      where: { id },
    });

    AuditService.log({
      actorUserId: actor.userId,
      action: "MODEL_DELETED",
      entityType: "GeminiModel",
      entityId: id,
      metadata: { modelName: deleted.modelName },
    });

    return apiSuccess(deleted);
  } catch (err) {
    return apiError(err);
  }
}

