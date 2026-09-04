import { NextRequest } from "next/server";
import { requireAuth, requireTenantAccess } from "@/server/auth/context";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/errors/app-error";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const isSuperAdmin = user.role === "SUPER_ADMIN";

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get("pageSize") || "10", 10)));
    const search = searchParams.get("search")?.trim() || "";
    const roleFilter = searchParams.get("role")?.trim() || "";
    const statusFilter = searchParams.get("status")?.trim() || "";

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(!isSuperAdmin && {
        tenantRoles: { some: { tenantId: user.tenantId || "" } },
      }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(statusFilter && statusFilter !== "ALL" && {
        status: statusFilter as any,
      }),
      ...(roleFilter && roleFilter !== "ALL" && {
        tenantRoles: {
          some: {
            role: { name: roleFilter },
          },
        },
      }),
    };

    const [total, items] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          tenantRoles: {
            include: { role: true, tenant: true },
          },
        },
      }),
    ]);

    return apiSuccess({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    return apiError(err);
  }
}
