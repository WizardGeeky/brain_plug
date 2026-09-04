import { z } from "zod";

export const updateWidgetConfigSchema = z
  .object({
    position: z.string().optional(),
    launcherType: z.string().optional(),
    buttonLabel: z.string().min(1).max(100).optional(),
    buttonIcon: z.string().min(1).max(50).optional(),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
    launcherColor: z.string().optional(),
    width: z.number().min(200).max(1000).optional(),
    height: z.number().min(300).max(1200).optional(),
    borderRadius: z.number().min(0).max(40).optional(),
    fontSize: z.number().min(10).max(24).optional(),
    animation: z.string().optional(),
    mobileMode: z.string().optional(),
    avatar: z.string().optional().nullable(),
    logoUrl: z.string().optional().nullable(),
    allowedOrigins: z.array(z.string()).optional(),
    allowedDomains: z.array(z.string()).optional(),
    hostAddress: z.string().optional(),
  })
  .partial();

