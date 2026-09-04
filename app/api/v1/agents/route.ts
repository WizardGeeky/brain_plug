import { NextRequest } from "next/server";
import { requireAuth, requireTenantAccess } from "@/server/auth/context";
import { prisma } from "@/lib/db/prisma";
import { AgentService } from "@/services/agent/agent.service";
import { createAgentSchema } from "@/schemas/agent.schema";
import { apiSuccess, apiError } from "@/lib/errors/app-error";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const targetTenantId = searchParams.get("tenantId") || undefined;
    const { tenantId } = await requireTenantAccess(targetTenantId);

    const agents = await prisma.agent.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      include: {
        geminiModel: true,
        widgetConfig: true,
        _count: {
          select: {
            documents: { where: { deletedAt: null } },
            conversations: true,
            apiKeys: { where: { status: "ACTIVE" } },
          },
        },
      },
    });

    return apiSuccess(agents);
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = req.nextUrl.searchParams;
    const targetTenantId = searchParams.get("tenantId") || undefined;
    const { tenantId } = await requireTenantAccess(targetTenantId);

    const body = await req.json();
    const validated = createAgentSchema.parse(body);

    const agent = await AgentService.createAgent(
      {
        ...validated,
        tenantId,
      },
      user.userId
    );

    return apiSuccess(agent, undefined, 201);
  } catch (err) {
    return apiError(err);
  }
}
