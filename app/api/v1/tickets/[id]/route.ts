import { NextRequest } from "next/server";
import { requireAuth, requireTenantAccess } from "@/server/auth/context";
import { TicketService } from "@/services/ticket/ticket.service";
import { apiSuccess, apiError } from "@/lib/errors/app-error";
import { TicketStatus } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const isSuperAdmin = user.role === "SUPER_ADMIN";

    let tenantId: string | undefined = undefined;
    if (!isSuperAdmin) {
      const tenantContext = await requireTenantAccess();
      tenantId = tenantContext.tenantId;
    }

    const ticket = await TicketService.getTicketById(id, tenantId, isSuperAdmin);
    return apiSuccess(ticket);
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
    const isSuperAdmin = user.role === "SUPER_ADMIN";

    let tenantId: string | undefined = undefined;
    if (!isSuperAdmin) {
      const tenantContext = await requireTenantAccess();
      tenantId = tenantContext.tenantId;
    }

    const body = await req.json();
    if (body.status) {
      const updated = await TicketService.updateTicketStatus(
        id,
        body.status as TicketStatus,
        user.userId,
        isSuperAdmin,
        tenantId
      );
      return apiSuccess(updated);
    }

    return apiSuccess({ message: "No changes applied" });
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
    const isSuperAdmin = user.role === "SUPER_ADMIN";

    let tenantId: string | undefined = undefined;
    if (!isSuperAdmin) {
      const tenantContext = await requireTenantAccess();
      tenantId = tenantContext.tenantId;
    }

    const deleted = await TicketService.deleteTicket(
      id,
      user.userId,
      isSuperAdmin,
      tenantId
    );
    return apiSuccess(deleted);
  } catch (err) {
    return apiError(err);
  }
}
