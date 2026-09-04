import { z } from "zod";

export const createModelSchema = z.object({
  apiKey: z.string().min(1, "Google Gemini API Key is required"),
  modelName: z.string().min(2, "Model identifier is required (e.g. gemini-2.0-flash)"),
  displayName: z.string().min(2, "Display name is required"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  provider: z.string().default("Google").optional(),
  description: z.string().optional(),
  isPublished: z.boolean().default(true).optional(),
  inputTokenPrice: z.number().min(0).default(0.0).optional(),
  outputTokenPrice: z.number().min(0).default(0.0).optional(),
  maxTokens: z.number().min(100).default(8192).optional(),
  supportsStreaming: z.boolean().default(true).optional(),
  supportsVision: z.boolean().default(false).optional(),
});

export const updateModelSchema = createModelSchema.partial();

