import { NextRequest } from "next/server";
import { requireAuth, requireRole } from "@/server/auth/context";
import { GeminiService } from "@/services/gemini/gemini.service";
import { apiSuccess, apiError } from "@/lib/errors/app-error";

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    await requireRole(["SUPER_ADMIN"]);

    let apiKey: string | undefined;
    let modelName: string | undefined;
    try {
      const body = await req.json();
      apiKey = body.apiKey;
      modelName = body.modelName;
    } catch {}

    const result = await GeminiService.testApiKey(apiKey, modelName);
    return apiSuccess(result);
  } catch (err) {
    return apiError(err);
  }
}
