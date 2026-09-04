import { NextRequest } from "next/server";
import { AuthService } from "@/services/auth/auth.service";
import { SessionService } from "@/server/auth/session.service";
import { verifyOtpSchema } from "@/schemas/auth.schema";
import { apiSuccess, apiError } from "@/lib/errors/app-error";
import { getClientIp } from "@/lib/ip";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = verifyOtpSchema.parse(body);

    const ip = getClientIp(req);
    const userAgent = req.headers.get("user-agent") || undefined;

    const sessionData = await AuthService.verifyOtpAndLogin(
      validated.email,
      validated.otp,
      validated.purpose,
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
