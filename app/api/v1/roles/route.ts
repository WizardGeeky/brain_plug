import { NextRequest } from "next/server";
import { requireRole } from "@/server/auth/context";
import { prisma } from "@/lib/db/prisma";
import { AuditService } from "@/server/audit/audit.service";
import { apiSuccess, apiError, AppError } from "@/lib/errors/app-error";

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN");

    const roles = await prisma.role.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: {
          select: { userRoles: true },
        },
      },
    });

    const permissions = await prisma.permission.findMany({
      orderBy: { module: "asc" },
    });

    return apiSuccess({ roles, permissions });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireRole("SUPER_ADMIN");
    const body = await req.json();

    const name = String(body.name || "").trim().toUpperCase().replace(/\s+/g, "_");
    const description = String(body.description || "").trim();
    const permissionIds: string[] = Array.isArray(body.permissionIds) ? body.permissionIds : [];

    if (!name) {
      throw new AppError("Role name is required", "VALIDATION_ERROR", 400);
    }

    const existing = await prisma.role.findUnique({
      where: { name },
    });
    if (existing) {
      throw new AppError(`Role with name '${name}' already exists`, "CONFLICT", 409);
    }

    const role = await prisma.role.create({
      data: {
        name,
        description: description || null,
        isSystem: false,
        permissions: {
          create: permissionIds.map((permissionId) => ({
            permissionId,
          })),
        },
      },
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: {
          select: { userRoles: true },
        },
      },
    });

    AuditService.log({
      actorUserId: actor.userId,
      action: "ROLE_CREATED",
      entityType: "Role",
      entityId: role.id,
      metadata: { roleName: role.name },
    });

    return apiSuccess(role, undefined, 201);
  } catch (err) {
    return apiError(err);
  }
}
