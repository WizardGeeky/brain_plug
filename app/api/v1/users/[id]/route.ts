import { NextRequest } from "next/server";
import { requireRole } from "@/server/auth/context";
import { prisma } from "@/lib/db/prisma";
import { AuditService } from "@/server/audit/audit.service";
import { apiSuccess, apiError, AppError } from "@/lib/errors/app-error";
import { UserStatus } from "@prisma/client";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireRole("SUPER_ADMIN");
    const { id } = await params;

    if (id === actor.userId) {
      throw new AppError("You cannot delete your own Super Admin account", "ACCESS_DENIED", 403);
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new AppError("User not found", "NOT_FOUND", 404);
    }

    const deleted = await prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.INACTIVE,
        deletedAt: new Date(),
        deletedBy: actor.userId,
      },
    });

    AuditService.log({
      actorUserId: actor.userId,
      action: "USER_DELETED",
      entityType: "User",
      entityId: id,
      metadata: { userEmail: user.email, userName: user.fullName },
    });

    return apiSuccess(deleted);
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

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError("User not found", "NOT_FOUND", 404);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status as UserStatus }),
        ...(body.fullName && { fullName: String(body.fullName).trim() }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.mobile !== undefined && { mobile: body.mobile }),
        updatedBy: actor.userId,
      },
    });

    AuditService.log({
      actorUserId: actor.userId,
      action: "USER_UPDATED",
      entityType: "User",
      entityId: id,
      metadata: { changes: Object.keys(body) },
    });

    return apiSuccess(updated);
  } catch (err) {
    return apiError(err);
  }
}
