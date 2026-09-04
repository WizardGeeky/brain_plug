import { prisma } from "@/lib/db/prisma";
import { TicketStatus, TicketPriority, TicketCategory } from "@prisma/client";
import { AppError } from "@/lib/errors/app-error";
import { EmailService } from "@/services/email/email.service";
import { AuditService } from "@/server/audit/audit.service";
import { Logger } from "@/lib/logger/logger";

export interface CreateTicketInput {
  tenantId: string;
  createdById: string;
  title: string;
  description: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  agentId?: string;
  attachmentUrl?: string;
  attachmentName?: string;
}

export class TicketService {
  /**
   * Generates a readable unique ticket number (e.g., TK-892301)
   */
  private static generateTicketNumber(): string {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    return `TK-${randomSuffix}`;
  }

  /**
   * Create a new support ticket (Client side)
   */
  public static async createTicket(input: CreateTicketInput) {
    const ticketNumber = this.generateTicketNumber();

    const tenant = await prisma.tenant.findUnique({
      where: { id: input.tenantId },
    });
    if (!tenant) throw new AppError("Tenant organization not found", "NOT_FOUND", 404);

    const creator = await prisma.user.findUnique({
      where: { id: input.createdById },
    });
    if (!creator) throw new AppError("User not found", "NOT_FOUND", 404);

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        tenantId: input.tenantId,
        createdById: input.createdById,
        agentId: input.agentId || null,
        title: input.title.trim(),
        description: input.description.trim(),
        category: input.category || TicketCategory.GENERAL,
        priority: input.priority || TicketPriority.MEDIUM,
        status: TicketStatus.OPEN,
        messages: {
          create: {
            senderId: input.createdById,
            senderRole: "CLIENT_USER",
            content: input.description.trim(),
            attachmentUrl: input.attachmentUrl || null,
            attachmentName: input.attachmentName || null,
          },
        },
      },
      include: {
        tenant: true,
        creator: true,
        agent: true,
        messages: {
          include: { sender: true },
        },
      },
    });

    // Notify Super Admin via Email
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@brainplug.ai";
    EmailService.sendTicketCreatedNotification(
      ticket,
      tenant.companyName,
      creator.fullName,
      adminEmail,
      true
    ).catch((err) => Logger.error("Failed to send ticket email to super admin", err));

    // Send confirmation to Client Creator
    EmailService.sendTicketCreatedNotification(
      ticket,
      tenant.companyName,
      creator.fullName,
      creator.email,
      false
    ).catch((err) => Logger.error("Failed to send ticket confirmation to client", err));

    AuditService.log({
      tenantId: input.tenantId,
      actorUserId: input.createdById,
      action: "TICKET_CREATED",
      entityType: "Ticket",
      entityId: ticket.id,
      metadata: { ticketNumber: ticket.ticketNumber, priority: ticket.priority },
    });

    return ticket;
  }

  /**
   * Get filtered tickets list
   */
  public static async getTickets(options: {
    tenantId?: string;
    isSuperAdmin?: boolean;
    status?: TicketStatus;
    priority?: TicketPriority;
    category?: TicketCategory;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {
      deletedAt: null,
    };

    if (!options.isSuperAdmin && options.tenantId) {
      where.tenantId = options.tenantId;
    } else if (options.tenantId) {
      where.tenantId = options.tenantId;
    }

    if (options.status) where.status = options.status;
    if (options.priority) where.priority = options.priority;
    if (options.category) where.category = options.category;

    if (options.search) {
      where.OR = [
        { ticketNumber: { contains: options.search, mode: "insensitive" } },
        { title: { contains: options.search, mode: "insensitive" } },
        { description: { contains: options.search, mode: "insensitive" } },
      ];
    }

    const [items, total, stats] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { updatedAt: "desc" },
        include: {
          tenant: true,
          creator: true,
          assignedTo: true,
          agent: true,
          _count: { select: { messages: true } },
        },
      }),
      prisma.ticket.count({ where }),
      prisma.ticket.groupBy({
        by: ["status"],
        where: options.isSuperAdmin ? { deletedAt: null } : { tenantId: options.tenantId, deletedAt: null },
        _count: { _all: true },
      }),
    ]);

    const statusCounts: Record<string, number> = {
      OPEN: 0,
      IN_PROGRESS: 0,
      WAITING_FOR_CLIENT: 0,
      RESOLVED: 0,
      CLOSED: 0,
    };
    for (const s of stats) {
      statusCounts[s.status] = s._count._all;
    }

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      statusCounts,
    };
  }

  /**
   * Get single ticket by ID with full message thread
   */
  public static async getTicketById(
    ticketId: string,
    tenantId?: string,
    isSuperAdmin = false
  ) {
    const where: any = { id: ticketId, deletedAt: null };
    if (!isSuperAdmin && tenantId) {
      where.tenantId = tenantId;
    }

    const ticket = await prisma.ticket.findFirst({
      where,
      include: {
        tenant: true,
        creator: true,
        assignedTo: true,
        agent: true,
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new AppError("Support ticket not found", "NOT_FOUND", 404);
    }

    return ticket;
  }

  /**
   * Add a reply message to a ticket
   */
  public static async addMessage(
    ticketId: string,
    senderId: string,
    senderRole: string,
    content: string,
    attachmentUrl?: string,
    attachmentName?: string,
    isInternalNote = false,
    tenantId?: string,
    isSuperAdmin = false
  ) {
    const ticket = await this.getTicketById(ticketId, tenantId, isSuperAdmin);

    const message = await prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId,
        senderRole,
        content: content.trim(),
        attachmentUrl: attachmentUrl || null,
        attachmentName: attachmentName || null,
        isInternalNote,
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Auto-update ticket status when replied
    let newStatus = ticket.status;
    if (senderRole === "SUPER_ADMIN") {
      if (ticket.status === TicketStatus.OPEN) {
        newStatus = TicketStatus.IN_PROGRESS;
      }
    } else {
      if (ticket.status === TicketStatus.WAITING_FOR_CLIENT) {
        newStatus = TicketStatus.IN_PROGRESS;
      }
    }

    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
    });

    // Send email notification to recipient
    if (!isInternalNote) {
      if (senderRole === "SUPER_ADMIN") {
        // Send email to client creator
        EmailService.sendTicketReplyNotification(
          ticket,
          message.sender.fullName,
          message.content,
          ticket.creator.email,
          false
        ).catch((e) => Logger.error("Failed to email client on ticket reply", e));
      } else {
        // Send email to super admin
        const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@brainplug.ai";
        EmailService.sendTicketReplyNotification(
          ticket,
          message.sender.fullName,
          message.content,
          adminEmail,
          true
        ).catch((e) => Logger.error("Failed to email super admin on ticket reply", e));
      }
    }

    return message;
  }

  /**
   * Update ticket status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
   */
  public static async updateTicketStatus(
    ticketId: string,
    newStatus: TicketStatus,
    actorUserId: string,
    isSuperAdmin = false,
    tenantId?: string
  ) {
    const ticket = await this.getTicketById(ticketId, tenantId, isSuperAdmin);

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: newStatus,
        resolvedAt:
          newStatus === TicketStatus.RESOLVED || newStatus === TicketStatus.CLOSED
            ? new Date()
            : null,
      },
      include: {
        tenant: true,
        creator: true,
      },
    });

    // Send status change email
    if (isSuperAdmin) {
      EmailService.sendTicketStatusNotification(
        updated,
        newStatus,
        updated.creator.email,
        false
      ).catch((e) => Logger.error("Failed to email status change", e));
    } else {
      const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@brainplug.ai";
      EmailService.sendTicketStatusNotification(
        updated,
        newStatus,
        adminEmail,
        true
      ).catch((e) => Logger.error("Failed to email status change to admin", e));
    }

    AuditService.log({
      tenantId: ticket.tenantId,
      actorUserId,
      action: "TICKET_STATUS_UPDATED",
      entityType: "Ticket",
      entityId: ticket.id,
      metadata: { oldStatus: ticket.status, newStatus },
    });

    return updated;
  }

  /**
   * Delete ticket (Super Admin or authorized tenant user)
   */
  public static async deleteTicket(
    ticketId: string,
    actorUserId: string,
    isSuperAdmin = false,
    tenantId?: string
  ) {
    const ticket = await this.getTicketById(ticketId, tenantId, isSuperAdmin);

    const deleted = await prisma.ticket.delete({
      where: { id: ticketId },
    });

    AuditService.log({
      tenantId: ticket.tenantId,
      actorUserId,
      action: "TICKET_DELETED",
      entityType: "Ticket",
      entityId: ticket.id,
      metadata: { ticketNumber: ticket.ticketNumber },
    });

    return deleted;
  }
}
