import { NextRequest } from "next/server";
import { requireAuth, requireRole } from "@/server/auth/context";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/errors/app-error";
import { cleanIp } from "@/lib/ip";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = req.nextUrl.searchParams;

    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
    const action = searchParams.get("action") || undefined;
    const entityType = searchParams.get("entityType") || undefined;
    const isExport = searchParams.get("export") === "csv";

    // Enforce tenant boundary unless super admin
    const tenantId = user.role === "SUPER_ADMIN" ? searchParams.get("tenantId") || undefined : user.tenantId || "";

    const where = {
      ...(tenantId ? { tenantId } : {}),
      ...(action ? { action } : {}),
      ...(entityType ? { entityType } : {}),
    };

    if (isExport) {
      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 1000,
        include: { actor: { select: { email: true, fullName: true } } },
      });

      let csv = "ID,Timestamp,Action,EntityType,EntityID,ActorEmail,ActorName,IPAddress\n";
      for (const log of logs) {
        const ip = cleanIp(log.ipAddress);
        csv += `"${log.id}","${log.createdAt.toISOString()}","${log.action}","${log.entityType}","${log.entityId || ""}","${log.actor?.email || ""}","${log.actor?.fullName || ""}","${ip}"\n`;
      }

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="audit_logs_${Date.now()}.csv"`,
        },
      });
    }

    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          actor: {
            select: { id: true, email: true, fullName: true, avatarUrl: true },
          },
          tenant: {
            select: { id: true, companyName: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Clean any loopback IPs in response
    const normalizedItems = items.map((log) => ({
      ...log,
      ipAddress: cleanIp(log.ipAddress),
    }));

    return apiSuccess({
      items: normalizedItems,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireRole("SUPER_ADMIN");
    const searchParams = req.nextUrl.searchParams;
    const days = searchParams.get("olderThanDays");

    let where = {};
    if (days) {
      const daysInt = parseInt(days, 10);
      const cutoff = new Date(Date.now() - daysInt * 24 * 60 * 60 * 1000);
      where = { createdAt: { lt: cutoff } };
    }

    const result = await prisma.auditLog.deleteMany({
      where,
    });

    return apiSuccess({
      message: `Successfully purged ${result.count} audit log records`,
      count: result.count,
    });
  } catch (err) {
    return apiError(err);
  }
}
