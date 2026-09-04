import { NextRequest } from "next/server";
import { AuthService } from "@/services/auth/auth.service";
import { SessionService } from "@/server/auth/session.service";
import { loginSchema } from "@/schemas/auth.schema";
import { apiSuccess, apiError, AppError } from "@/lib/errors/app-error";
import { OtpPurpose } from "@prisma/client";
import { getClientIp } from "@/lib/ip";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const userAgent = req.headers.get("user-agent") || "unknown";

    const body = await req.json();
    const validated = loginSchema.parse(body);

    if (!validated.otp) {
      // Request an OTP for this email
      const result = await AuthService.requestOtp(validated.email, OtpPurpose.LOGIN, ip, userAgent);
      return apiSuccess(result);
    }

    const sessionData = await AuthService.verifyOtpAndLogin(
      validated.email,
      validated.otp,
      OtpPurpose.LOGIN,
      ip,
      userAgent
    );

    // Set HTTP-only cookies
    await SessionService.setCookies(sessionData.accessToken, sessionData.refreshToken);

    return apiSuccess({
      user: sessionData.userPayload,
      accessToken: sessionData.accessToken,
    });
  } catch (err) {
    return apiError(err);
  }
}
