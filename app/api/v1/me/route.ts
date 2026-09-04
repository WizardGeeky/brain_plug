import { NextRequest } from "next/server";
import { getCurrentUser, requireAuth } from "@/server/auth/context";
import { prisma } from "@/lib/db/prisma";
import { updateProfileSchema } from "@/schemas/auth.schema";
import { apiSuccess, apiError } from "@/lib/errors/app-error";

export async function GET() {
  try {
    const userPayload = await getCurrentUser();
    if (!userPayload) {
      return apiSuccess(null);
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userPayload.userId },
        select: {
          id: true,
          fullName: true,
          email: true,
          mobile: true,
          gender: true,
          location: true,
          avatarUrl: true,
          status: true,
          emailVerified: true,
          mobileVerified: true,
          lastLoginAt: true,
          createdAt: true,
          tenantRoles: {
            include: {
              role: true,
              tenant: true,
            },
          },
          sessions: {
            where: { revokedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { lastActiveAt: "desc" },
            take: 5,
            select: {
              id: true,
              ipAddress: true,
              userAgent: true,
              device: true,
              lastActiveAt: true,
              createdAt: true,
            },
          },
        },
      });

      if (!user) {
        // Stale session or user deleted from new database
        return apiSuccess({
          id: userPayload.userId,
          fullName: userPayload.fullName,
          email: userPayload.email,
          currentRole: userPayload.role,
          permissions: userPayload.permissions,
          currentTenantId: userPayload.tenantId,
        });
      }

      return apiSuccess({
        ...user,
        currentRole: userPayload.role,
        permissions: userPayload.permissions,
        currentTenantId: userPayload.tenantId,
      });
    } catch (dbErr) {
      console.error("[/api/v1/me] Database query error, falling back to JWT payload:", dbErr);
      return apiSuccess({
        id: userPayload.userId,
        fullName: userPayload.fullName,
        email: userPayload.email,
        currentRole: userPayload.role,
        permissions: userPayload.permissions,
        currentTenantId: userPayload.tenantId,
      });
    }
  } catch (err) {
    console.error("[/api/v1/me] Unhandled error:", err);
    return apiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userPayload = await requireAuth();
    const body = await req.json();
    const validated = updateProfileSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id: userPayload.userId },
      data: {
        ...(validated.fullName && { fullName: validated.fullName }),
        ...(validated.mobile !== undefined && { mobile: validated.mobile }),
        ...(validated.gender !== undefined && { gender: validated.gender }),
        ...(validated.location !== undefined && { location: validated.location }),
        ...(validated.avatarUrl !== undefined && { avatarUrl: validated.avatarUrl }),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobile: true,
        gender: true,
        location: true,
        avatarUrl: true,
        status: true,
      },
    });

    return apiSuccess(updated);
  } catch (err) {
    return apiError(err);
  }
}
