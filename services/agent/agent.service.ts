import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors/app-error";
import { AuditService } from "@/server/audit/audit.service";
import { AgentStatus, AgentType, Prisma } from "@prisma/client";
import { getOrCreateAgentApiKey } from "@/lib/encryption/api-key-helper";

export interface CreateAgentInput {
  tenantId: string;
  name: string;
  description?: string;
  type?: AgentType;
  avatar?: string;
  systemPrompt: string;
  welcomeMessage: string;
  geminiModelId: string;
  temperature?: number;
  maxOutputTokens?: number;
  ragEnabled?: boolean;
  topK?: number;
  similarityThreshold?: number;
  hostAddress?: string;
  allowedDomains?: string[];
  widgetConfig?: Partial<{
    position: string;
    launcherType: string;
    buttonLabel: string;
    buttonIcon: string;
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    launcherColor: string;
    width: number;
    height: number;
    borderRadius: number;
    fontSize: number;
    animation: string;
    mobileMode: string;
  }>;
}

export class AgentService {
  /**
   * Create new Agent with default or customized widget configuration and allowed host addresses
   */
  public static async createAgent(input: CreateAgentInput, actorUserId?: string) {
    // 1. Validate Gemini model is published and active
    const model = await prisma.geminiModel.findUnique({
      where: { id: input.geminiModelId },
    });

    if (!model || model.status !== "ACTIVE" || !model.isPublished) {
      throw new AppError(
        "Please select an active, published Gemini model",
        "MODEL_NOT_AVAILABLE",
        400
      );
    }

    // Parse host addresses / domains
    const domainsToSeed: string[] = [];
    if (input.hostAddress && input.hostAddress.trim()) {
      const splitHosts = input.hostAddress.split(/[\n,]+/).map((h) => h.trim().toLowerCase()).filter(Boolean);
      domainsToSeed.push(...splitHosts);
    }
    if (input.allowedDomains && Array.isArray(input.allowedDomains)) {
      domainsToSeed.push(...input.allowedDomains.map((h) => h.trim().toLowerCase()).filter(Boolean));
    }
    const uniqueDomains = Array.from(new Set(domainsToSeed));

    // 2. Create agent + widget config + allowed domains atomically
    const agent = await prisma.$transaction(async (tx) => {
      const createdAgent = await tx.agent.create({
        data: {
          tenantId: input.tenantId,
          name: input.name,
          description: input.description || null,
          type: input.type || AgentType.CHAT,
          avatar: input.avatar || null,
          systemPrompt: input.systemPrompt,
          welcomeMessage: input.welcomeMessage,
          geminiModelId: input.geminiModelId,
          temperature: input.temperature ?? 0.7,
          maxOutputTokens: input.maxOutputTokens ?? 2048,
          status: AgentStatus.ACTIVE,
          ragEnabled: input.ragEnabled ?? true,
          topK: input.topK ?? 5,
          similarityThreshold: input.similarityThreshold ?? 0.4,
        },
      });

      const wc = input.widgetConfig || {};
      await tx.agentWidgetConfig.create({
        data: {
          agentId: createdAgent.id,
          tenantId: input.tenantId,
          position: wc.position || "BOTTOM_RIGHT",
          launcherType: wc.launcherType || "BUTTON",
          buttonLabel: wc.buttonLabel || "Chat with us",
          buttonIcon: wc.buttonIcon || "MessageSquare",
          primaryColor: wc.primaryColor || "#7c3aed",
          secondaryColor: wc.secondaryColor || "#ede9fe",
          backgroundColor: wc.backgroundColor || "#ffffff",
          textColor: wc.textColor || "#1e1b4b",
          launcherColor: wc.launcherColor || "#7c3aed",
          width: wc.width || 400,
          height: wc.height || 600,
          borderRadius: wc.borderRadius || 16,
          fontSize: wc.fontSize || 14,
          animation: wc.animation || "slide-up",
          mobileMode: wc.mobileMode || "bottom-sheet",
        },
      });

      for (const domain of uniqueDomains) {
        await tx.allowedDomain.create({
          data: {
            agentId: createdAgent.id,
            tenantId: input.tenantId,
            domain,
          },
        });
      }

      return createdAgent;
    });

    // Auto-provision initial active API key for embed script
    const apiKey = await getOrCreateAgentApiKey(input.tenantId, agent.id, actorUserId);

    AuditService.log({
      tenantId: input.tenantId,
      actorUserId,
      action: "AGENT_CREATED",
      entityType: "Agent",
      entityId: agent.id,
      metadata: { name: agent.name, model: model.displayName, allowedDomains: uniqueDomains },
    });

    return {
      ...agent,
      apiKey,
    };
  }

  /**
   * Get agent by ID with strict tenant isolation
   */
  public static async getAgentById(tenantId: string, agentId: string) {
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, tenantId: tenantId || undefined, deletedAt: null },
      include: {
        geminiModel: true,
        widgetConfig: true,
        _count: {
          select: {
            documents: { where: { deletedAt: null } },
            conversations: true,
            apiKeys: { where: { status: "ACTIVE" } },
          },
        },
      },
    });

    if (!agent) {
      throw new AppError("Agent not found", "AGENT_NOT_FOUND", 404);
    }

    const apiKey = await getOrCreateAgentApiKey(agent.tenantId, agent.id);

    return {
      ...agent,
      apiKey,
    };
  }

  /**
   * Update Agent
   */
  public static async updateAgent(
    tenantId: string,
    agentId: string,
    data: Prisma.AgentUpdateInput,
    actorUserId?: string
  ) {
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, tenantId, deletedAt: null },
    });

    if (!agent) {
      throw new AppError("Agent not found", "AGENT_NOT_FOUND", 404);
    }

    const updated = await prisma.agent.update({
      where: { id: agentId },
      data,
    });

    AuditService.log({
      tenantId,
      actorUserId,
      action: "AGENT_UPDATED",
      entityType: "Agent",
      entityId: agent.id,
      metadata: { changes: Object.keys(data) },
    });

    return updated;
  }

  /**
   * Publish / Unpublish Agent
   */
  public static async togglePublish(
    tenantId: string,
    agentId: string,
    isPublished: boolean,
    actorUserId?: string
  ) {
    const agent = await this.getAgentById(tenantId, agentId);

    const updated = await prisma.agent.update({
      where: { id: agent.id },
      data: {
        status: isPublished ? AgentStatus.ACTIVE : AgentStatus.INACTIVE,
        isPublic: isPublished,
      },
    });

    AuditService.log({
      tenantId,
      actorUserId,
      action: isPublished ? "AGENT_PUBLISHED" : "AGENT_UNPUBLISHED",
      entityType: "Agent",
      entityId: agent.id,
    });

    return updated;
  }

  /**
   * Soft delete Agent
   */
  public static async deleteAgent(
    tenantId: string,
    agentId: string,
    actorUserId?: string
  ) {
    const agent = await this.getAgentById(tenantId, agentId);

    await prisma.agent.update({
      where: { id: agent.id },
      data: {
        status: AgentStatus.ARCHIVED,
        deletedAt: new Date(),
      },
    });

    AuditService.log({
      tenantId,
      actorUserId,
      action: "AGENT_DELETED",
      entityType: "Agent",
      entityId: agent.id,
      metadata: { name: agent.name },
    });
  }
}
