import { NextRequest } from "next/server";
import { requireAuth, requireRole } from "@/server/auth/context";
import { prisma } from "@/lib/db/prisma";
import { GeminiService } from "@/services/gemini/gemini.service";
import { AuditService } from "@/server/audit/audit.service";
import { apiSuccess, apiError, AppError } from "@/lib/errors/app-error";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    await requireRole(["SUPER_ADMIN"]);

    // Fetch platform settings from database
    const settings = await prisma.platformSetting.findMany();
    const settingsMap: Record<string, any> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    const geminiStatus = await GeminiService.getApiKeyStatus();

    return apiSuccess({
      gemini: {
        configured: geminiStatus.configured,
        source: geminiStatus.source,
        maskedKey: geminiStatus.maskedKey,
      },
      general: {
        brandName: settingsMap["brand_name"]?.name || "Brain Plug",
        supportEmail:
          settingsMap["support_email"]?.email || "support@brainplug.ai",
        otpExpiryMinutes: settingsMap["otp_expiry"]?.minutes || 5,
      },
    });
  } catch (err) {
    return apiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    await requireRole(["SUPER_ADMIN"]);

    const body = await req.json();

    // 1. Update Gemini API Key if provided
    if (typeof body.geminiApiKey === "string" && body.geminiApiKey.trim().length > 0) {
      await GeminiService.setApiKey(body.geminiApiKey.trim());

      AuditService.log({
        actorUserId: user.userId,
        action: "GEMINI_API_KEY_UPDATED",
        entityType: "PlatformSetting",
        entityId: "gemini_api_key",
        metadata: { updatedBy: user.email },
      });
    }

    // 2. Update brand name if provided
    if (body.brandName) {
      await prisma.platformSetting.upsert({
        where: { key: "brand_name" },
        create: {
          key: "brand_name",
          value: { name: body.brandName.trim() },
        },
        update: {
          value: { name: body.brandName.trim() },
        },
      });
    }

    // 3. Update support email if provided
    if (body.supportEmail) {
      await prisma.platformSetting.upsert({
        where: { key: "support_email" },
        create: {
          key: "support_email",
          value: { email: body.supportEmail.trim() },
        },
        update: {
          value: { email: body.supportEmail.trim() },
        },
      });
    }

    // 4. Update OTP expiry if provided
    if (body.otpExpiryMinutes) {
      await prisma.platformSetting.upsert({
        where: { key: "otp_expiry" },
        create: {
          key: "otp_expiry",
          value: { minutes: parseInt(body.otpExpiryMinutes, 10) },
        },
        update: {
          value: { minutes: parseInt(body.otpExpiryMinutes, 10) },
        },
      });
    }

    return apiSuccess({ message: "Platform settings updated successfully" });
  } catch (err) {
    return apiError(err);
  }
}
