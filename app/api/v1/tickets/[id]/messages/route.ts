import { NextRequest } from "next/server";
import { requireAuth, requireTenantAccess } from "@/server/auth/context";
import { TicketService } from "@/services/ticket/ticket.service";
import { apiSuccess, apiError, AppError } from "@/lib/errors/app-error";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: ticketId } = await params;
    const isSuperAdmin = user.role === "SUPER_ADMIN";

    let tenantId: string | undefined = undefined;
    if (!isSuperAdmin) {
      const tenantContext = await requireTenantAccess();
      tenantId = tenantContext.tenantId;
    }

    const body = await req.json();
    if (!body.content?.trim()) {
      throw new AppError("Message content is required", "VALIDATION_ERROR", 422);
    }

    const message = await TicketService.addMessage(
      ticketId,
      user.userId,
      user.role,
      body.content,
      body.attachmentUrl,
      body.attachmentName,
      body.isInternalNote || false,
      tenantId,
      isSuperAdmin
    );

    return apiSuccess(message, undefined, 201);
  } catch (err) {
    return apiError(err);
  }
}
