import { NextRequest } from "next/server";
import { AuthService } from "@/services/auth/auth.service";
import { requestOtpSchema } from "@/schemas/auth.schema";
import { apiSuccess, apiError } from "@/lib/errors/app-error";
import { OtpPurpose } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = requestOtpSchema.parse(body);

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    const result = await AuthService.requestOtp(
      validated.email,
      OtpPurpose.LOGIN,
      ip,
      userAgent
    );

    return apiSuccess({
      message: result.message || "Brain Plug uses passwordless OTP sign-in. A 6-digit verification code has been sent to your email.",
    });
  } catch (err) {
    return apiError(err);
  }
}
