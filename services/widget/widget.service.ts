import { prisma } from "@/lib/db/prisma";
import { EncryptionService } from "@/lib/encryption/encryption.service";
import { AppError } from "@/lib/errors/app-error";
import { ApiKeyStatus } from "@prisma/client";
import { isOriginAllowed } from "@/lib/cors";

export class WidgetService {
  /**
   * Validate API Key and Agent status for public widget interaction
   */
  public static async validateWidgetAuth(
    agentId: string,
    apiKeyRaw?: string | null,
    requestOrigin?: string | null
  ) {
    // If raw key is provided and is not a placeholder dummy key
    let apiKey: any = null;
    if (apiKeyRaw && apiKeyRaw.trim() && apiKeyRaw.trim() !== "YOUR_AGENT_API_KEY") {
      const keyHash = EncryptionService.hashSha256(apiKeyRaw.trim());

      apiKey = await prisma.apiKey.findUnique({
        where: { keyHash },
        include: {
          agent: {
            include: {
              geminiModel: true,
              widgetConfig: true,
              allowedDomains: true,
            },
          },
          tenant: true,
        },
      });

      if (!apiKey || apiKey.status !== ApiKeyStatus.ACTIVE) {
        throw new AppError("Invalid or revoked API Key", "API_KEY_INVALID", 401);
      }

      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        throw new AppError("API Key has expired", "API_KEY_REVOKED", 401);
      }

      if (apiKey.agentId !== agentId) {
        throw new AppError(
          "API Key does not belong to the requested agent",
          "ACCESS_DENIED",
          403
        );
      }
    }

    const agent = apiKey
      ? apiKey.agent
      : await prisma.agent.findFirst({
          where: { id: agentId, deletedAt: null },
          include: {
            geminiModel: true,
            widgetConfig: true,
            allowedDomains: true,
            tenant: true,
          },
        });

    if (!agent || agent.status !== "ACTIVE") {
      throw new AppError(
        "Agent is inactive or unavailable",
        "AGENT_NOT_FOUND",
        404
      );
    }

    // Validate origin / host address if configured
    if (agent.allowedDomains && agent.allowedDomains.length > 0 && requestOrigin) {
      const allowed = isOriginAllowed(requestOrigin, agent.allowedDomains);
      if (!allowed) {
        throw new AppError(
          `Host address ${requestOrigin} is not authorized for this agent`,
          "WIDGET_ORIGIN_NOT_ALLOWED",
          403
        );
      }
    }

    // Update last used timestamp if apiKey exists
    if (apiKey) {
      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      });
    }

    return {
      apiKey,
      agent,
      tenant: apiKey ? apiKey.tenant : agent.tenant,
    };
  }

  /**
   * Get public configuration for embeddable widget
   */
  public static async getPublicWidgetConfig(agentId: string, requestOrigin?: string | null) {
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, deletedAt: null },
      include: {
        widgetConfig: true,
        allowedDomains: true,
      },
    });

    if (!agent || agent.status !== "ACTIVE") {
      throw new AppError("Agent not found or inactive", "AGENT_NOT_FOUND", 404);
    }

    // Check origin allowlist if configured
    if (agent.allowedDomains && agent.allowedDomains.length > 0 && requestOrigin) {
      const allowed = isOriginAllowed(requestOrigin, agent.allowedDomains);
      if (!allowed) {
        throw new AppError(
          `Host address ${requestOrigin} is not authorized to embed this agent`,
          "WIDGET_ORIGIN_NOT_ALLOWED",
          403
        );
      }
    }

    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      avatar: agent.avatar,
      welcomeMessage: agent.welcomeMessage,
      status: agent.status,
      widgetConfig: agent.widgetConfig,
    };
  }
}
