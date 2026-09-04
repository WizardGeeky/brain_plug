import { NextRequest } from "next/server";
import { requireRole } from "@/server/auth/context";
import { prisma } from "@/lib/db/prisma";
import { AuditService } from "@/server/audit/audit.service";
import { apiSuccess, apiError, AppError } from "@/lib/errors/app-error";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireRole("SUPER_ADMIN");
    const { id } = await params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { userRoles: true } } },
    });

    if (!role) {
      throw new AppError("Role not found", "NOT_FOUND", 404);
    }

    // 1. Delete all role permissions mappings first
    await prisma.rolePermission.deleteMany({
      where: { roleId: id },
    });

    // 2. If users have this role, reassign them to another active role (or CLIENT_USER/SUPER_ADMIN)
    if (role._count.userRoles > 0) {
      const fallbackRole = await prisma.role.findFirst({
        where: { id: { not: id } },
      });

      if (fallbackRole) {
        await prisma.userTenantRole.updateMany({
          where: { roleId: id },
          data: { roleId: fallbackRole.id },
        });
      } else {
        await prisma.userTenantRole.deleteMany({
          where: { roleId: id },
        });
      }
    }

    // 3. Delete the role
    const deleted = await prisma.role.delete({
      where: { id },
    });

    AuditService.log({
      actorUserId: actor.userId,
      action: "ROLE_DELETED",
      entityType: "Role",
      entityId: id,
      metadata: { roleName: role.name },
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

    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new AppError("Role not found", "NOT_FOUND", 404);
    }

    const description = body.description !== undefined ? String(body.description).trim() : undefined;
    const permissionIds: string[] | undefined = Array.isArray(body.permissionIds) ? body.permissionIds : undefined;

    // If updating permissions, remove old and add new
    if (permissionIds !== undefined) {
      await prisma.rolePermission.deleteMany({
        where: { roleId: id },
      });

      if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map((pId) => ({
            roleId: id,
            permissionId: pId,
          })),
        });
      }
    }

    const updated = await prisma.role.update({
      where: { id },
      data: {
        ...(description !== undefined && { description }),
      },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    AuditService.log({
      actorUserId: actor.userId,
      action: "ROLE_UPDATED",
      entityType: "Role",
      entityId: id,
      metadata: { roleName: role.name },
    });

    return apiSuccess(updated);
  } catch (err) {
    return apiError(err);
  }
}
