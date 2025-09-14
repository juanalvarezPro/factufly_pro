import { OrganizationRole, SubscriptionStatus, UserStatus } from "@prisma/client";
import * as z from "zod";

// Organization slug validation - URL-safe, lowercase, 3-50 chars
const organizationSlugSchema = z
  .string()
  .min(3, "Slug must be at least 3 characters")
  .max(50, "Slug must be at most 50 characters")
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Slug must be lowercase alphanumeric with hyphens only"
  );

// Domain validation - optional, must be valid domain
const domainSchema = z
  .string()
  .regex(
    /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/,
    "Must be a valid domain"
  )
  .optional();

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must be at most 100 characters"),
  slug: organizationSlugSchema,
  domain: domainSchema,
  logo: z.string().url().optional(),
  settings: z.record(z.any()).default({}),
});

export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must be at most 100 characters")
    .optional(),
  domain: domainSchema,
  logo: z.string().url().optional(),
  subscriptionStatus: z.nativeEnum(SubscriptionStatus).optional(),
  trialEndsAt: z.date().optional(),
  settings: z.record(z.any()).optional(),
});

export const organizationMemberSchema = z.object({
  userId: z.string().cuid(),
  organizationId: z.string().cuid(),
  role: z.nativeEnum(OrganizationRole).default(OrganizationRole.USER),
  status: z.nativeEnum(UserStatus).default(UserStatus.pending),
});

export const updateOrganizationMemberSchema = z.object({
  role: z.nativeEnum(OrganizationRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export const organizationInvitationSchema = z.object({
  email: z.string().email("Must be a valid email address"),
  organizationId: z.string().cuid(),
  role: z.nativeEnum(OrganizationRole).default(OrganizationRole.USER),
  expiresAt: z.date().refine((date) => date > new Date(), {
    message: "Expiration date must be in the future",
  }),
});

// Organization context validation for multi-tenant operations
export const organizationContextSchema = z.object({
  organizationId: z.string().cuid("Invalid organization ID"),
});

// Organization settings schemas for typed settings
export const organizationSettingsSchema = z.object({
  branding: z
    .object({
      primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
      logo: z.string().url().optional(),
      favicon: z.string().url().optional(),
    })
    .optional(),
  features: z
    .object({
      enableProductCombos: z.boolean().default(true),
      enableInventoryTracking: z.boolean().default(true),
      enableAdvancedRules: z.boolean().default(false),
    })
    .optional(),
  notifications: z
    .object({
      lowStockThreshold: z.number().min(0).default(10),
      emailNotifications: z.boolean().default(true),
    })
    .optional(),
});

// Type exports
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type OrganizationMemberInput = z.infer<typeof organizationMemberSchema>;
export type UpdateOrganizationMemberInput = z.infer<typeof updateOrganizationMemberSchema>;
export type OrganizationInvitationInput = z.infer<typeof organizationInvitationSchema>;
export type OrganizationContextInput = z.infer<typeof organizationContextSchema>;
export type OrganizationSettingsInput = z.infer<typeof organizationSettingsSchema>;
