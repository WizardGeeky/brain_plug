import { z } from "zod";

export const createClientSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  companyName: z.string().min(2, "Company name is required"),
  email: z.string().email("Valid email is required"),
  mobile: z.string().optional(),
  gender: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).default("ACTIVE"),
});

export const updateClientSchema = z.object({
  companyName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  mobile: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  logoUrl: z.string().url().optional().nullable(),
});
