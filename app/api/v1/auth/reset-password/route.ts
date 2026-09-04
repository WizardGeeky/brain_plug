import { NextRequest } from "next/server";
import { AuthService } from "@/services/auth/auth.service";
import { verifyOtpSchema } from "@/schemas/auth.schema";
import { SessionService } from "@/server/auth/session.service";
import { apiSuccess, apiError } from "@/lib/errors/app-error";
import { OtpPurpose } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = verifyOtpSchema.parse(body);

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    const sessionData = await AuthService.verifyOtpAndLogin(
      validated.email,
      validated.otp,
      OtpPurpose.LOGIN,
      ip,
      userAgent
    );

    await SessionService.setCookies(sessionData.accessToken, sessionData.refreshToken);

    return apiSuccess({
      message: "Verified successfully. Brain Plug uses passwordless sign-in.",
      user: sessionData.userPayload,
    });
  } catch (err) {
    return apiError(err);
  }
}
