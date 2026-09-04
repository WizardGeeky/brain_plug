import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/auth/context";
import { SessionService } from "@/server/auth/session.service";
import { apiSuccess, apiError } from "@/lib/errors/app-error";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (user?.sessionId) {
      await SessionService.revokeSession(user.sessionId);
    }
    await SessionService.clearCookies();
    return apiSuccess({ message: "Logged out successfully" });
  } catch (err) {
    return apiError(err);
  }
}
