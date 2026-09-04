import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  otp: z.string().length(6, "OTP must be exactly 6 digits").optional(),
});

export const requestOtpSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  purpose: z.enum(["LOGIN", "EMAIL_VERIFICATION", "ONBOARDING"]).default("LOGIN"),
});

export const verifyOtpSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
  purpose: z.enum(["LOGIN", "EMAIL_VERIFICATION", "ONBOARDING"]).default("LOGIN"),
});

export const registerClientSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  companyName: z.string().min(2, "Workspace / Company name must be at least 2 characters"),
  email: z.string().email("Please provide a valid email address"),
  mobile: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
});

export const onboardingSchema = z.object({
  token: z.string().min(1, "Onboarding token is required"),
  fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
  mobile: z.string().optional(),
  location: z.string().optional(),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Full name is required").optional(),
  mobile: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
});
