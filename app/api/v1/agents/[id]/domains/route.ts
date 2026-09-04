import { NextRequest } from "next/server";
import { requireAuth, requireTenantAccess } from "@/server/auth/context";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, AppError } from "@/lib/errors/app-error";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id: agentId } = await params;
    const { tenantId } = await requireTenantAccess();

    const domains = await prisma.allowedDomain.findMany({
      where: { agentId, tenantId },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(domains);
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id: agentId } = await params;
    const { tenantId } = await requireTenantAccess();

    const body = await req.json();
    const domain = body.domain?.trim().toLowerCase();

    if (!domain) {
      throw new AppError("Domain is required", "VALIDATION_ERROR", 422);
    }

    const created = await prisma.allowedDomain.create({
      data: {
        agentId,
        tenantId,
        domain,
      },
    });

    return apiSuccess(created, undefined, 201);
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id: agentId } = await params;
    const { tenantId } = await requireTenantAccess();
    const domainId = req.nextUrl.searchParams.get("domainId");

    if (!domainId) {
      return apiError(new AppError("domainId query parameter required", "VALIDATION_ERROR", 400));
    }

    await prisma.allowedDomain.deleteMany({
      where: { id: domainId, agentId, tenantId },
    });

    return apiSuccess({ message: "Domain deleted successfully" });
  } catch (err) {
    return apiError(err);
  }
}
