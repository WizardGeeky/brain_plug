import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { EncryptionService } from "@/lib/encryption/encryption.service";
import { Logger } from "@/lib/logger/logger";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "brain_plug_jwt_super_secret_key_32bytes_min_2026"
);

const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || "brain_plug_refresh_token_super_secret_key_2026"
);

export interface TokenPayload {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  tenantId?: string | null;
  permissions: string[];
  sessionId: string;
}

export class SessionService {
  private static ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRY || "3h"; // 3 hours
  private static REFRESH_TOKEN_EXPIRY = "7d"; // 7 days

  /**
   * Generates a signed Access JWT
   */
  public static async createAccessToken(payload: TokenPayload): Promise<string> {
    return new SignJWT({ ...payload })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(this.ACCESS_TOKEN_EXPIRY)
      .sign(JWT_SECRET);
  }

  /**
   * Generates a signed Refresh JWT
   */
  public static async createRefreshToken(sessionId: string, userId: string): Promise<string> {
    return new SignJWT({ sessionId, userId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(this.REFRESH_TOKEN_EXPIRY)
      .sign(REFRESH_SECRET);
  }

  /**
   * Verify Access Token
   */
  public static async verifyAccessToken(token: string): Promise<TokenPayload | null> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      return payload as unknown as TokenPayload;
    } catch {
      return null;
    }
  }

  /**
   * Verify Refresh Token
   */
  public static async verifyRefreshToken(
    token: string
  ): Promise<{ sessionId: string; userId: string } | null> {
    try {
      const { payload } = await jwtVerify(token, REFRESH_SECRET);
      return payload as unknown as { sessionId: string; userId: string };
    } catch {
      return null;
    }
  }

  /**
   * Create a full authenticated session with database tracking and cookies
   */
  public static async createSession(
    userId: string,
    tenantId?: string | null,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ accessToken: string; refreshToken: string; userPayload: TokenPayload }> {
    // 1. Fetch user, roles, permissions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenantRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
            tenant: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Determine primary role & tenant
    const primaryTenantRole = tenantId
      ? user.tenantRoles.find((tr) => tr.tenantId === tenantId) || user.tenantRoles[0]
      : user.tenantRoles[0];

    const roleName = primaryTenantRole?.role.name || "CLIENT_USER";
    const resolvedTenantId = primaryTenantRole?.tenantId || null;

    const permissions = Array.from(
      new Set(
        primaryTenantRole?.role.permissions.map((rp) => rp.permission.code) || []
      )
    );

    // 2. Insert session record
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        tenantId: resolvedTenantId,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        expiresAt,
      },
    });

    // 3. Generate tokens
    const userPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: roleName,
      tenantId: resolvedTenantId,
      permissions,
      sessionId: session.id,
    };

    const accessToken = await this.createAccessToken(userPayload);
    const refreshToken = await this.createRefreshToken(session.id, user.id);

    // Store hashed refresh token
    const refreshTokenHash = EncryptionService.hashSha256(refreshToken);
    await prisma.session.update({
      where: { id: session.id },
      data: { refreshTokenHash },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return { accessToken, refreshToken, userPayload };
  }

  /**
   * Set HTTP-only cookies in response
   */
  public static async setCookies(accessToken: string, refreshToken: string) {
    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === "production";

    cookieStore.set("bp_session", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 3 * 60 * 60, // 3 hours (10,800 seconds)
    });

    cookieStore.set("bp_refresh", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });
  }

  /**
   * Clear session cookies
   */
  public static async clearCookies() {
    const cookieStore = await cookies();
    cookieStore.delete("bp_session");
    cookieStore.delete("bp_refresh");
  }

  /**
   * Invalidate a session
   */
  public static async revokeSession(sessionId: string) {
    try {
      await prisma.session.update({
        where: { id: sessionId },
        data: { revokedAt: new Date() },
      });
    } catch (err) {
      Logger.warn("Error revoking session", { sessionId, err });
    }
  }

  /**
   * Revoke all user sessions
   */
  public static async revokeAllUserSessions(userId: string) {
    await prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
