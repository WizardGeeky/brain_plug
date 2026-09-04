import { z } from "zod";

export const createAgentSchema = z.object({
  name: z.string().min(2, "Agent name must be at least 2 characters"),
  description: z.string().optional(),
  type: z.enum(["CHAT", "ASSISTANT", "CUSTOM", "VOICE"]).default("CHAT"),
  avatar: z.string().optional(),
  systemPrompt: z.string().min(5, "System prompt must be at least 5 characters"),
  welcomeMessage: z.string().min(2, "Welcome message is required"),
  geminiModelId: z.string().min(1, "Please select a valid published Gemini model"),
  temperature: z.number().min(0).max(2).default(0.7),
  maxOutputTokens: z.number().min(100).max(8192).default(2048),
  ragEnabled: z.boolean().default(true),
  topK: z.number().min(1).max(20).default(5),
  similarityThreshold: z.number().min(0.0).max(1.0).default(0.4),
  hostAddress: z.string().optional(),
  allowedDomains: z.array(z.string()).optional(),
  widgetConfig: z
    .object({
      position: z.string().default("BOTTOM_RIGHT"),
      launcherType: z.string().default("BUTTON"),
      buttonLabel: z.string().default("Chat with us"),
      buttonIcon: z.string().default("MessageSquare"),
      primaryColor: z.string().default("#7c3aed"),
      secondaryColor: z.string().default("#ede9fe"),
      backgroundColor: z.string().default("#ffffff"),
      textColor: z.string().default("#1e1b4b"),
      launcherColor: z.string().default("#7c3aed"),
      width: z.number().default(400),
      height: z.number().default(600),
      borderRadius: z.number().default(16),
      fontSize: z.number().default(14),
      animation: z.string().default("slide-up"),
      mobileMode: z.string().default("bottom-sheet"),
    })
    .optional(),
});

export const updateAgentSchema = createAgentSchema.partial();

