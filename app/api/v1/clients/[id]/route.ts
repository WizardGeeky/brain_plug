import { NextRequest } from "next/server";
import { requireRole } from "@/server/auth/context";
import { prisma } from "@/lib/db/prisma";
import { updateClientSchema } from "@/schemas/client.schema";
import { AuditService } from "@/server/audit/audit.service";
import { apiSuccess, apiError, AppError } from "@/lib/errors/app-error";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("SUPER_ADMIN");
    const { id } = await params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        agents: {
          where: { deletedAt: null },
          include: { geminiModel: true },
        },
        userRoles: {
          include: { user: true, role: true },
        },
        _count: {
          select: {
            documents: { where: { deletedAt: null } },
            conversations: true,
            apiKeys: { where: { status: "ACTIVE" } },
          },
        },
      },
    });

    if (!tenant || tenant.deletedAt) {
      throw new AppError("Client not found", "NOT_FOUND", 404);
    }

    return apiSuccess(tenant);
  } catch (err) {
    return apiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireRole("SUPER_ADMIN");
    const { id } = await params;
    const body = await req.json();
    const validated = updateClientSchema.parse(body);

    const updated = await prisma.tenant.update({
      where: { id },
      data: {
        ...(validated.companyName && {
          companyName: validated.companyName,
          name: validated.companyName,
        }),
        ...(validated.email && { email: validated.email }),
        ...(validated.mobile !== undefined && { mobile: validated.mobile }),
        ...(validated.status && { status: validated.status }),
        ...(validated.logoUrl !== undefined && { logoUrl: validated.logoUrl }),
      },
    });

    AuditService.log({
      tenantId: id,
      actorUserId: actor.userId,
      action: "CLIENT_UPDATED",
      entityType: "Tenant",
      entityId: id,
      metadata: { changes: Object.keys(validated) },
    });

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
    const actor = await requireRole("SUPER_ADMIN");
    const { id } = await params;

    const deleted = await prisma.tenant.update({
      where: { id },
      data: {
        status: "SUSPENDED",
        deletedAt: new Date(),
      },
    });

    AuditService.log({
      tenantId: id,
      actorUserId: actor.userId,
      action: "CLIENT_SUSPENDED",
      entityType: "Tenant",
      entityId: id,
    });

    return apiSuccess(deleted);
  } catch (err) {
    return apiError(err);
  }
}
