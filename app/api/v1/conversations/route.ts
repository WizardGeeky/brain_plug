import { NextRequest } from "next/server";
import { requireAuth, requireTenantAccess } from "@/server/auth/context";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/errors/app-error";

export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await requireTenantAccess();
    const searchParams = req.nextUrl.searchParams;
    const agentId = searchParams.get("agentId") || undefined;

    const conversations = await prisma.conversation.findMany({
      where: {
        tenantId,
        ...(agentId ? { agentId } : {}),
      },
      orderBy: { updatedAt: "desc" },
      include: {
        agent: {
          select: { id: true, name: true, avatar: true },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    return apiSuccess(conversations);
  } catch (err) {
    return apiError(err);
  }
}
