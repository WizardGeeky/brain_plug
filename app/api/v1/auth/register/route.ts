import { NextRequest } from "next/server";
import { AuthService } from "@/services/auth/auth.service";
import { registerClientSchema } from "@/schemas/auth.schema";
import { apiSuccess, apiError } from "@/lib/errors/app-error";
import { getClientIp } from "@/lib/ip";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const userAgent = req.headers.get("user-agent") || "unknown";

    const body = await req.json();
    const validated = registerClientSchema.parse(body);

    const result = await AuthService.registerClient(validated, ip, userAgent);

    return apiSuccess(result);
  } catch (err) {
    return apiError(err);
  }
}
