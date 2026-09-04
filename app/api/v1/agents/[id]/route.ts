import { NextRequest } from "next/server";
import { requireAuth, requireTenantAccess } from "@/server/auth/context";
import { AgentService } from "@/services/agent/agent.service";
import { updateAgentSchema } from "@/schemas/agent.schema";
import { apiSuccess, apiError } from "@/lib/errors/app-error";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { tenantId } = await requireTenantAccess();

    const agent = await AgentService.getAgentById(tenantId, id);
    return apiSuccess(agent);
  } catch (err) {
    return apiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { tenantId } = await requireTenantAccess();

    const body = await req.json();
    const { widgetConfig, ...agentData } = updateAgentSchema.parse(body);

    const updated = await AgentService.updateAgent(
      tenantId,
      id,
      agentData as any,
      user.userId
    );

    return apiSuccess(updated);
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { tenantId } = await requireTenantAccess();

    await AgentService.deleteAgent(tenantId, id, user.userId);
    return apiSuccess({ message: "Agent deleted successfully" });
  } catch (err) {
    return apiError(err);
  }
}
