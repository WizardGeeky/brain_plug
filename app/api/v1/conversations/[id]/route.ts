import { NextRequest } from "next/server";
import { requireAuth, requireTenantAccess } from "@/server/auth/context";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, AppError } from "@/lib/errors/app-error";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { tenantId } = await requireTenantAccess();

    const conversation = await prisma.conversation.findFirst({
      where: { id, tenantId },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            avatar: true,
            welcomeMessage: true,
            geminiModel: { select: { displayName: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      throw new AppError("Conversation not found", "NOT_FOUND", 404);
    }

    return apiSuccess(conversation);
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const { tenantId } = await requireTenantAccess();

    await prisma.conversation.deleteMany({
      where: { id, tenantId },
    });

    return apiSuccess({ message: "Conversation deleted successfully" });
  } catch (err) {
    return apiError(err);
  }
}
