import { NextRequest } from "next/server";
import { getCurrentUser, requireRole } from "@/server/auth/context";
import { prisma } from "@/lib/db/prisma";
import { createModelSchema } from "@/schemas/model.schema";
import { AuditService } from "@/server/audit/audit.service";
import { apiSuccess, apiError } from "@/lib/errors/app-error";
import { GeminiService } from "@/services/gemini/gemini.service";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const isSuperAdmin = user?.role === "SUPER_ADMIN";

    // Super admin sees all models; Clients see ONLY active and published models
    const where = isSuperAdmin
      ? {}
      : { isPublished: true, status: "ACTIVE" as const };

    const rawModels = await prisma.geminiModel.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });

    let maskedKey: string | undefined = undefined;
    if (isSuperAdmin) {
      try {
        const keyStatus = await GeminiService.getApiKeyStatus();
        maskedKey = keyStatus.maskedKey;
      } catch (e) {
        // Non-blocking
      }
    }

    const models = rawModels.map((m) => {
      return {
        ...m,
        maskedApiKey: maskedKey,
      };
    });

    return apiSuccess(models);
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("SUPER_ADMIN");
    const body = await req.json();
    const validated = createModelSchema.parse(body);

    // 1. Save and configure the Gemini API key in platform_settings
    if (validated.apiKey && validated.apiKey.trim().length > 0) {
      await GeminiService.setApiKey(validated.apiKey.trim());
    }

    const isPublished =
      validated.isPublished !== undefined
        ? validated.isPublished
        : validated.status === "ACTIVE";

    // 2. Register the model in database
    const model = await prisma.geminiModel.create({
      data: {
        modelName: validated.modelName.trim(),
        displayName: validated.displayName.trim(),
        provider: validated.provider || "Google",
        description: validated.description || null,
        status: validated.status,
        isPublished: isPublished,
        inputTokenPrice: validated.inputTokenPrice ?? 0,
        outputTokenPrice: validated.outputTokenPrice ?? 0,
        maxTokens: validated.maxTokens ?? 8192,
        supportsStreaming: validated.supportsStreaming ?? true,
        supportsVision: validated.supportsVision ?? false,
      },
    });

    AuditService.log({
      actorUserId: user.userId,
      action: "MODEL_CREATED",
      entityType: "GeminiModel",
      entityId: model.id,
      metadata: { modelName: model.modelName },
    });

    return apiSuccess(model, undefined, 201);
  } catch (err) {
    return apiError(err);
  }
}


