import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireTenantAccess } from "@/server/auth/context";
import { prisma } from "@/lib/db/prisma";
import { updateWidgetConfigSchema } from "@/schemas/widget.schema";
import { apiSuccess, apiError } from "@/lib/errors/app-error";
import { getCorsHeaders, handleCorsPreflight } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsHeaders = getCorsHeaders(req);
  try {
    const { id: agentId } = await params;
    const { tenantId } = await requireTenantAccess();

    const [agent, config, allowedDomains] = await Promise.all([
      prisma.agent.findUnique({
        where: { id: agentId },
        select: { avatar: true },
      }),
      prisma.agentWidgetConfig.findUnique({
        where: { agentId },
      }),
      prisma.allowedDomain.findMany({
        where: { agentId },
        select: { domain: true },
      }),
    ]);

    const result = {
      ...(config || {}),
      avatar: agent?.avatar || null,
      allowedOrigins: allowedDomains.map((d) => d.domain),
    };

    return NextResponse.json(
      { success: true, data: result, requestId: crypto.randomUUID() },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    const errRes = apiError(err);
    Object.entries(corsHeaders).forEach(([k, v]) => {
      errRes.headers.set(k, v);
    });
    return errRes;
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsHeaders = getCorsHeaders(req);
  try {
    const { id: agentId } = await params;
    const { tenantId } = await requireTenantAccess();

    const body = await req.json();
    const validated = updateWidgetConfigSchema.parse(body);

    const { allowedOrigins, allowedDomains, hostAddress, avatar, logoUrl, ...widgetData } = validated;

    if (avatar !== undefined || logoUrl !== undefined) {
      await prisma.agent.update({
        where: { id: agentId },
        data: { avatar: avatar ?? logoUrl ?? null },
      });
    }

    const config = await prisma.agentWidgetConfig.upsert({
      where: { agentId },
      update: widgetData,
      create: {
        ...widgetData,
        agentId,
        tenantId: tenantId || "",
      },
    });

    // Sync allowed domains if provided
    const originsToSet = allowedOrigins || allowedDomains || (hostAddress ? [hostAddress] : undefined);
    if (originsToSet !== undefined) {
      await prisma.allowedDomain.deleteMany({
        where: { agentId },
      });

      const cleanDomains = originsToSet
        .map((d) => d.trim().toLowerCase())
        .filter((d) => d.length > 0);

      const uniqueDomains = Array.from(new Set(cleanDomains));

      for (const domain of uniqueDomains) {
        await prisma.allowedDomain.create({
          data: {
            agentId,
            tenantId: tenantId || "",
            domain,
          },
        });
      }
    }

    const currentAllowed = await prisma.allowedDomain.findMany({
      where: { agentId },
      select: { domain: true },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...config,
          allowedOrigins: currentAllowed.map((d) => d.domain),
        },
        requestId: crypto.randomUUID(),
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    const errRes = apiError(err);
    Object.entries(corsHeaders).forEach(([k, v]) => {
      errRes.headers.set(k, v);
    });
    return errRes;
  }
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  return PATCH(req, ctx);
}
