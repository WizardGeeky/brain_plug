import { NextRequest } from "next/server";
import { requireAuth, requireTenantAccess } from "@/server/auth/context";
import { TicketService } from "@/services/ticket/ticket.service";
import { apiSuccess, apiError, AppError } from "@/lib/errors/app-error";
import { TicketStatus, TicketPriority, TicketCategory } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const isSuperAdmin = user.role === "SUPER_ADMIN";

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as TicketStatus | null;
    const priority = searchParams.get("priority") as TicketPriority | null;
    const category = searchParams.get("category") as TicketCategory | null;
    const search = searchParams.get("search") || undefined;
    const tenantIdParam = searchParams.get("tenantId") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

    let targetTenantId: string | undefined = undefined;
    if (isSuperAdmin) {
      targetTenantId = tenantIdParam;
    } else {
      const tenantContext = await requireTenantAccess();
      targetTenantId = tenantContext.tenantId;
    }

    const result = await TicketService.getTickets({
      tenantId: targetTenantId,
      isSuperAdmin,
      status: status || undefined,
      priority: priority || undefined,
      category: category || undefined,
      search,
      page,
      pageSize,
    });

    return apiSuccess(result);
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { tenantId } = await requireTenantAccess();

    const body = await req.json();
    if (!body.title?.trim() || !body.description?.trim()) {
      throw new AppError("Ticket title and description are required", "VALIDATION_ERROR", 422);
    }

    const ticket = await TicketService.createTicket({
      tenantId,
      createdById: user.userId,
      title: body.title,
      description: body.description,
      category: body.category,
      priority: body.priority,
      agentId: body.agentId,
      attachmentUrl: body.attachmentUrl,
      attachmentName: body.attachmentName,
    });

    return apiSuccess(ticket, undefined, 201);
  } catch (err) {
    return apiError(err);
  }
}
