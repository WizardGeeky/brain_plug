import { NextRequest } from "next/server";
import { requireAuth, requireTenantAccess } from "@/server/auth/context";
import { AgentService } from "@/services/agent/agent.service";
import { apiSuccess, apiError } from "@/lib/errors/app-error";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { tenantId } = await requireTenantAccess();

    const updated = await AgentService.togglePublish(tenantId, id, false, user.userId);
    return apiSuccess(updated);
  } catch (err) {
    return apiError(err);
  }
}
