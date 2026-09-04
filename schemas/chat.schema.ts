import { z } from "zod";

export const chatRequestSchema = z.object({
  agentId: z.string().uuid("Valid agent ID is required"),
  conversationId: z.string().uuid().nullable().optional(),
  sessionIdentifier: z.string().nullable().optional(),
  message: z.string().min(1, "Message cannot be empty").max(10000, "Message is too long"),
});

export const createApiKeySchema = z.object({
  name: z.string().min(2, "API Key name is required"),
  scopes: z.array(z.string()).default(["chat:write"]),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

export const addAllowedDomainSchema = z.object({
  domain: z.string().min(3, "Domain is required (e.g. example.com or http://localhost:3000)"),
});
