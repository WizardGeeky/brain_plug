import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { EncryptionService } from "@/lib/encryption/encryption.service";
import { EmailService } from "@/services/email/email.service";
import { AuditService } from "@/server/audit/audit.service";
import { AppError } from "@/lib/errors/app-error";
import { TenantStatus, UserStatus } from "@prisma/client";

export interface CreateClientInput {
  fullName: string;
  companyName: string;
  email: string;
  mobile?: string;
  gender?: string;
  location?: string;
  status?: TenantStatus;
}

export class ClientService {
  /**
   * Super Admin Onboard Client Flow
   */
  public static async createClient(
    input: CreateClientInput,
    actorUserId?: string
  ) {
    const normalizedEmail = input.email.toLowerCase().trim();

    // Check if user or company slug already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new AppError(
        "A user with this email address already exists",
        "CONFLICT",
        409
      );
    }

    const baseSlug = input.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const slug = `${baseSlug}-${crypto.randomBytes(3).toString("hex")}`;
    const rawOnboardingToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = EncryptionService.hashSha256(rawOnboardingToken);

    // Fetch CLIENT_ADMIN role
    const clientAdminRole = await prisma.role.findUnique({
      where: { name: "CLIENT_ADMIN" },
    });

    if (!clientAdminRole) {
      throw new AppError("System role CLIENT_ADMIN not configured", "INTERNAL_SERVER_ERROR", 500);
    }

    // Execute atomic creation
    const { tenant, user } = await prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const newTenant = await tx.tenant.create({
        data: {
          name: input.companyName,
          companyName: input.companyName,
          slug,
          email: normalizedEmail,
          mobile: input.mobile || null,
          status: input.status || TenantStatus.ACTIVE,
        },
      });

      // 2. Create User as PENDING / ACTIVE
      const newUser = await tx.user.create({
        data: {
          fullName: input.fullName,
          email: normalizedEmail,
          mobile: input.mobile || null,
          gender: input.gender || null,
          location: input.location || null,
          status: UserStatus.ACTIVE,
          emailVerified: false,
          createdBy: actorUserId || null,
        },
      });

      // 3. Assign CLIENT_ADMIN role to user for this tenant
      await tx.userTenantRole.create({
        data: {
          userId: newUser.id,
          tenantId: newTenant.id,
          roleId: clientAdminRole.id,
        },
      });

      // 4. Create Onboarding Token (valid for 48 hours)
      await tx.onboardingToken.create({
        data: {
          tenantId: newTenant.id,
          userId: newUser.id,
          email: normalizedEmail,
          tokenHash,
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      return { tenant: newTenant, user: newUser };
    });

    // 5. Send Welcome Email asynchronously
    await EmailService.sendWelcomeOnboarding(
      normalizedEmail,
      input.fullName,
      input.companyName,
      rawOnboardingToken
    );

    // 6. Audit event
    AuditService.log({
      tenantId: tenant.id,
      actorUserId,
      action: "CLIENT_CREATED",
      entityType: "Tenant",
      entityId: tenant.id,
      metadata: { companyName: tenant.companyName, clientEmail: normalizedEmail },
    });

    return { tenant, user, onboardingToken: rawOnboardingToken };
  }

  /**
   * Get all clients with paginated stats for Super Admin
   */
  public static async getClients(page = 1, pageSize = 10, search = "") {
    const skip = (page - 1) * pageSize;
    const where = {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { companyName: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              agents: { where: { deletedAt: null } },
              userRoles: true,
              documents: { where: { deletedAt: null } },
              conversations: true,
            },
          },
        },
      }),
      prisma.tenant.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
