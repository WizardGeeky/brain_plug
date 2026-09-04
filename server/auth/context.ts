import { cookies, headers } from "next/headers";
import { SessionService, TokenPayload } from "./session.service";
import { AppError } from "@/lib/errors/app-error";
import { prisma } from "@/lib/db/prisma";

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("bp_session")?.value;
  if (sessionCookie) return sessionCookie;

  const headerStore = await headers();
  const authHeader = headerStore.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return null;
}

export async function getCurrentUser(): Promise<TokenPayload | null> {
  const token = await getAuthToken();
  if (!token) return null;

  const payload = await SessionService.verifyAccessToken(token);
  if (!payload) return null;

  return payload;
}

export async function getCurrentTenant(): Promise<{ id: string; name: string } | null> {
  const user = await getCurrentUser();
  if (!user?.tenantId) return null;

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: { id: true, name: true, status: true },
  });

  if (!tenant || tenant.status !== "ACTIVE") {
    return null;
  }

  return tenant;
}

export async function requireAuth(): Promise<TokenPayload> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AppError("Authentication required to access this resource", "AUTH_REQUIRED", 401);
  }
  return user;
}

export async function requireRole(allowedRoles: string | string[]): Promise<TokenPayload> {
  const user = await requireAuth();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(user.role)) {
    throw new AppError(
      `Access denied. Required role: ${roles.join(", ")}`,
      "ACCESS_DENIED",
      403
    );
  }

  return user;
}

export async function requirePermission(permissionCode: string): Promise<TokenPayload> {
  const user = await requireAuth();

  // Super admin possesses all permissions
  if (user.role === "SUPER_ADMIN") {
    return user;
  }

  if (!user.permissions.includes(permissionCode)) {
    throw new AppError(
      `Access denied. Missing permission: ${permissionCode}`,
      "ACCESS_DENIED",
      403
    );
  }

  return user;
}

export async function requireTenantAccess(targetTenantId?: string): Promise<{
  user: TokenPayload;
  tenantId: string;
}> {
  const user = await requireAuth();

  // Super admin can access any tenant specified in query/header or default
  if (user.role === "SUPER_ADMIN") {
    if (!targetTenantId && !user.tenantId) {
      // If super admin didn't specify target tenant, fetch first active tenant or null
      return { user, tenantId: targetTenantId || "" };
    }
    return { user, tenantId: targetTenantId || user.tenantId || "" };
  }

  // Client users can ONLY access their own tenant
  if (!user.tenantId) {
    throw new AppError("Tenant context missing", "TENANT_ACCESS_DENIED", 403);
  }

  if (targetTenantId && targetTenantId !== user.tenantId) {
    throw new AppError(
      "You are not authorized to access data belonging to another tenant",
      "TENANT_ACCESS_DENIED",
      403
    );
  }

  return { user, tenantId: user.tenantId };
}
