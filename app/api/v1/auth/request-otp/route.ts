import { NextRequest } from "next/server";
import { AuthService } from "@/services/auth/auth.service";
import { requestOtpSchema } from "@/schemas/auth.schema";
import { apiSuccess, apiError } from "@/lib/errors/app-error";
import { getClientIp } from "@/lib/ip";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = requestOtpSchema.parse(body);

    const ip = getClientIp(req);
    const userAgent = req.headers.get("user-agent") || undefined;

    const result = await AuthService.requestOtp(
      validated.email,
      validated.purpose,
      ip,
      userAgent
    );

    return apiSuccess(result);
  } catch (err) {
    return apiError(err);
  }
}
