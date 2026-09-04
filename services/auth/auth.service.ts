import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { EncryptionService } from "@/lib/encryption/encryption.service";
import { EmailService } from "@/services/email/email.service";
import { SessionService, TokenPayload } from "@/server/auth/session.service";
import { AuditService } from "@/server/audit/audit.service";
import { RateLimiter } from "@/server/rate-limit/rate-limiter";
import { AppError } from "@/lib/errors/app-error";
import { OtpPurpose, UserStatus, TenantStatus } from "@prisma/client";

export class AuthService {
  /**
   * Passwordless Request a 6-digit OTP
   */
  public static async requestOtp(
    email: string,
    purpose: OtpPurpose = OtpPurpose.LOGIN,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ message: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    const rateCheck = RateLimiter.check(`otp:req:${normalizedEmail}`, 5, 300);
    if (!rateCheck.allowed) {
      throw new AppError(
        `OTP rate limit exceeded. Please wait ${rateCheck.resetInSeconds} seconds.`,
        "OTP_RATE_LIMITED",
        429
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Invalidate any active OTPs for this email and purpose
    await prisma.otpVerification.deleteMany({
      where: {
        email: normalizedEmail,
        purpose,
        usedAt: null,
      },
    });

    const otp = EncryptionService.generateOtp();
    const otpHash = EncryptionService.hashSha256(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.otpVerification.create({
      data: {
        userId: user?.id || null,
        email: normalizedEmail,
        purpose,
        otpHash,
        expiresAt,
        maxAttempts: 5,
        ipAddress,
        userAgent,
      },
    });

    console.log(`\n==================================================`);
    console.log(`🔑 [AUTH OTP] 6-Digit Passcode for ${normalizedEmail}: ${otp} (Valid for 5 mins)`);
    console.log(`==================================================\n`);

    // Dispatch email and log outcome
    try {
      await EmailService.sendOtpEmail(normalizedEmail, otp, purpose);
    } catch (err: any) {
      console.error(`[AuthService] Error dispatching OTP email to ${normalizedEmail}:`, err?.message || err);
    }

    AuditService.log({
      actorUserId: user?.id,
      action: "OTP_REQUESTED",
      entityType: "OtpVerification",
      metadata: { email: normalizedEmail, purpose },
      ipAddress,
      userAgent,
    });

    return {
      message: "If an account exists with this email, a 6-digit verification code has been sent.",
    };
  }

  /**
   * Verify OTP and Login
   */
  public static async verifyOtpAndLogin(
    email: string,
    otp: string,
    purpose: OtpPurpose = OtpPurpose.LOGIN,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ accessToken: string; refreshToken: string; userPayload: TokenPayload }> {
    const normalizedEmail = email.toLowerCase().trim();
    const otpHash = EncryptionService.hashSha256(otp.trim());

    const verification = await prisma.otpVerification.findFirst({
      where: {
        email: normalizedEmail,
        purpose,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!verification) {
      throw new AppError("Invalid or expired OTP", "INVALID_OTP", 400);
    }

    if (verification.attemptCount >= verification.maxAttempts) {
      throw new AppError("Maximum OTP attempts exceeded. Request a new OTP.", "OTP_RATE_LIMITED", 429);
    }

    if (verification.otpHash !== otpHash) {
      await prisma.otpVerification.update({
        where: { id: verification.id },
        data: { attemptCount: { increment: 1 } },
      });
      throw new AppError("Invalid OTP", "INVALID_OTP", 400);
    }

    // Mark as used
    await prisma.otpVerification.update({
      where: { id: verification.id },
      data: { usedAt: new Date() },
    });

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
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

    if (!user || user.deletedAt || user.status !== UserStatus.ACTIVE) {
      throw new AppError("User account not found or is currently inactive", "ACCESS_DENIED", 403);
    }

    // Update email verified flag & last login
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, lastLoginAt: new Date() },
    });

    const activeRole = user.tenantRoles[0];
    const sessionData = await SessionService.createSession(
      user.id,
      activeRole?.tenantId,
      ipAddress,
      userAgent
    );

    AuditService.log({
      tenantId: activeRole?.tenantId,
      actorUserId: user.id,
      action: "LOGIN_SUCCESS",
      entityType: "User",
      entityId: user.id,
      metadata: { method: "OTP" },
      ipAddress,
      userAgent,
    });

    return sessionData;
  }

  /**
   * Client Onboarding Completion (Passwordless)
   */
  public static async completeOnboarding(
    token: string,
    fullName?: string,
    mobile?: string,
    location?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ accessToken: string; refreshToken: string; userPayload: TokenPayload }> {
    const tokenHash = EncryptionService.hashSha256(token);

    const onboarding = await prisma.onboardingToken.findUnique({
      where: { tokenHash },
      include: {
        user: true,
        tenant: true,
      },
    });

    if (!onboarding || onboarding.usedAt || onboarding.expiresAt < new Date()) {
      throw new AppError(
        "Invalid or expired onboarding invitation",
        "ACCESS_DENIED",
        400
      );
    }

    // Update user record with profile details
    const updatedUser = await prisma.user.update({
      where: { id: onboarding.userId },
      data: {
        fullName: fullName || onboarding.user.fullName,
        mobile: mobile || onboarding.user.mobile,
        location: location || onboarding.user.location,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    });

    // Mark onboarding token used
    await prisma.onboardingToken.update({
      where: { id: onboarding.id },
      data: { usedAt: new Date() },
    });

    // Create session
    const sessionData = await SessionService.createSession(
      updatedUser.id,
      onboarding.tenantId,
      ipAddress,
      userAgent
    );

    AuditService.log({
      tenantId: onboarding.tenantId,
      actorUserId: updatedUser.id,
      action: "ONBOARDING_COMPLETED",
      entityType: "User",
      entityId: updatedUser.id,
      metadata: { tenantId: onboarding.tenantId },
      ipAddress,
      userAgent,
    });

    return sessionData;
  }

  /**
   * Open Self-Service Client Workspace Registration
   * Creates Tenant, User, assigns CLIENT_ADMIN role, provisions starter AI agent, and dispatches 6-digit OTP
   */
  public static async registerClient(
    input: {
      fullName: string;
      companyName: string;
      email: string;
      mobile?: string | null;
      location?: string | null;
    },
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ message: string; email: string }> {
    const normalizedEmail = input.email.toLowerCase().trim();

    // Check rate limit for registration
    const rateCheck = RateLimiter.check(`reg:${normalizedEmail}`, 3, 300);
    if (!rateCheck.allowed) {
      throw new AppError(
        `Registration rate limit exceeded. Please wait ${rateCheck.resetInSeconds} seconds.`,
        "OTP_RATE_LIMITED",
        429
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { tenantRoles: true },
    });

    if (existingUser && existingUser.tenantRoles && existingUser.tenantRoles.length > 0) {
      throw new AppError(
        "An account with this email address already exists. Please switch to the Sign In tab.",
        "CONFLICT",
        409
      );
    }

    const baseSlug = input.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "workspace";

    const slug = `${baseSlug}-${crypto.randomBytes(3).toString("hex")}`;

    const clientAdminRole = await prisma.role.findUnique({
      where: { name: "CLIENT_ADMIN" },
    });

    if (!clientAdminRole) {
      throw new AppError("System role CLIENT_ADMIN not configured", "INTERNAL_SERVER_ERROR", 500);
    }

    // Default active Gemini model
    const defaultModel = await prisma.geminiModel.findFirst({
      where: { status: "ACTIVE", isPublished: true },
    });

    await prisma.$transaction(async (tx) => {
      // 1. Create Tenant Workspace
      const tenant = await tx.tenant.create({
        data: {
          name: input.companyName.trim(),
          companyName: input.companyName.trim(),
          slug,
          email: normalizedEmail,
          mobile: input.mobile || null,
          status: TenantStatus.ACTIVE,
        },
      });

      // 2. Create or Update User
      let userId: string;
      if (!existingUser) {
        const newUser = await tx.user.create({
          data: {
            fullName: input.fullName.trim(),
            email: normalizedEmail,
            mobile: input.mobile || null,
            location: input.location || null,
            status: UserStatus.ACTIVE,
            emailVerified: false,
          },
        });
        userId = newUser.id;
      } else {
        userId = existingUser.id;
        await tx.user.update({
          where: { id: existingUser.id },
          data: {
            fullName: input.fullName.trim(),
            mobile: input.mobile || existingUser.mobile,
            location: input.location || existingUser.location,
            status: UserStatus.ACTIVE,
          },
        });
      }

      // 3. Assign CLIENT_ADMIN role
      await tx.userTenantRole.create({
        data: {
          userId,
          tenantId: tenant.id,
          roleId: clientAdminRole.id,
        },
      });

      // 4. Create Starter Agent for instant client testing
      const starterAgent = await tx.agent.create({
        data: {
          tenantId: tenant.id,
          name: `${input.companyName.trim()} AI Assistant`,
          description: `Primary customer support AI assistant for ${input.companyName.trim()}`,
          type: "CHAT",
          systemPrompt: `You are a helpful and polite customer support AI assistant for ${input.companyName.trim()}. Answer inquiries accurately, helpfully, and concisely.`,
          welcomeMessage: `Hello! Welcome to ${input.companyName.trim()}. How can I assist you today?`,
          geminiModelId: defaultModel?.id || null,
          status: "ACTIVE",
          isPublic: true,
          ragEnabled: true,
        },
      });

      // 5. Default Widget Config
      await tx.agentWidgetConfig.create({
        data: {
          agentId: starterAgent.id,
          tenantId: tenant.id,
          buttonLabel: "Chat with us",
          primaryColor: "#7c3aed",
          secondaryColor: "#ede9fe",
          backgroundColor: "#ffffff",
          textColor: "#1e1b4b",
        },
      });
    });

    // 6. Generate and send 6-digit OTP for instant email verification & login
    await this.requestOtp(normalizedEmail, OtpPurpose.LOGIN, ipAddress, userAgent);

    AuditService.log({
      action: "CLIENT_SELF_REGISTERED",
      entityType: "Tenant",
      metadata: { email: normalizedEmail, companyName: input.companyName },
      ipAddress,
      userAgent,
    });

    return {
      message: `Workspace created! A 6-digit verification code has been sent to ${normalizedEmail}.`,
      email: normalizedEmail,
    };
  }
}
