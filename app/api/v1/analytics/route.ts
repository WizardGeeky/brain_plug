import { NextRequest } from "next/server";
import { getCurrentUser, requireAuth } from "@/server/auth/context";
import { AnalyticsService } from "@/services/analytics/analytics.service";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/errors/app-error";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = req.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "30", 10);
    const targetTenantId = searchParams.get("tenantId") || user.tenantId;

    if (user.role === "SUPER_ADMIN" && !targetTenantId) {
      const metrics = await AnalyticsService.getSuperAdminMetrics(days);

      // Fetch recent daily activity for charts
      const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const recentEvents = await prisma.usageEvent.findMany({
        where: { createdAt: { gte: sinceDate } },
        select: {
          id: true,
          eventType: true,
          inputTokens: true,
          outputTokens: true,
          latencyMs: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      });

      return apiSuccess({
        overview: metrics,
        trafficChart: metrics.trafficChart,
        agentDistribution: metrics.agentDistribution,
        modelDistribution: metrics.modelDistribution,
        topTenants: metrics.topTenants,
        topAgents: metrics.topAgents,
        recentAuditLogs: metrics.recentAuditLogs,
        events: recentEvents,
      });
    }

    if (!targetTenantId) {
      return apiSuccess({ overview: null, events: [] });
    }

    const metrics = await AnalyticsService.getClientMetrics(targetTenantId, days);
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const recentEvents = await prisma.usageEvent.findMany({
      where: { tenantId: targetTenantId, createdAt: { gte: sinceDate } },
      select: {
        id: true,
        eventType: true,
        inputTokens: true,
        outputTokens: true,
        latencyMs: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return apiSuccess({
      overview: metrics,
      events: recentEvents,
    });
  } catch (err) {
    return apiError(err);
  }
}
