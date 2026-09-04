import { NextRequest } from "next/server";
import { AuthService } from "@/services/auth/auth.service";
import { SessionService } from "@/server/auth/session.service";
import { onboardingSchema } from "@/schemas/auth.schema";
import { apiSuccess, apiError } from "@/lib/errors/app-error";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = onboardingSchema.parse(body);

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    const sessionData = await AuthService.completeOnboarding(
      validated.token,
      validated.fullName,
      validated.mobile,
      validated.location,
      ip,
      userAgent
    );

    await SessionService.setCookies(sessionData.accessToken, sessionData.refreshToken);

    return apiSuccess({
      user: sessionData.userPayload,
      accessToken: sessionData.accessToken,
    });
  } catch (err) {
    return apiError(err);
  }
}
