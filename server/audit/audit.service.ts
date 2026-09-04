import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { cleanIp } from "@/lib/ip";

export interface CreateAuditLogParams {
  tenantId?: string | null;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AuditService {
  /**
   * Records an audit event asynchronously in the database with normalized real client IP.
   */
  public static async log(params: CreateAuditLogParams): Promise<void> {
    try {
      const normalizedIp = params.ipAddress ? cleanIp(params.ipAddress) : "127.0.0.1";

      await prisma.auditLog.create({
        data: {
          tenantId: params.tenantId || null,
          actorUserId: params.actorUserId || null,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId || null,
          metadata: (params.metadata || {}) as Prisma.InputJsonValue,
          ipAddress: normalizedIp,
          userAgent: params.userAgent || null,
        },
      });
    } catch {
      // Quiet fail to avoid polluting stdout
    }
  }
}
