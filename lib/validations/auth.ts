import * as z from "zod";
import { cuidSchema, emailSchema, phoneSchema } from "./common";

// ===== ROLE AND PERMISSION SCHEMAS =====

export const organizationRoleSchema = z.enum(["OWNER", "ADMIN", "MANAGER", "USER"], {
  errorMap: () => ({ message: "Invalid organization role" })
});

export const permissionActionSchema = z.enum([
  "CREATE", "READ", "UPDATE", "DELETE", "RESTORE", "ARCHIVE",
  "MANAGE_USERS", "MANAGE_ROLES", "MANAGE_BILLING", "EXPORT_DATA",
  "VIEW_ANALYTICS", "CONFIGURE_SETTINGS"
], {
  errorMap: () => ({ message: "Invalid permission action" })
});

export const resourceTypeSchema = z.enum([
  "organization", "product", "combo", "category", "packaging", 
  "stock", "user", "role", "billing", "settings", "analytics"
], {
  errorMap: () => ({ message: "Invalid resource type" })
});

// ===== USER VALIDATION SCHEMAS =====

export const userStatusSchema = z.enum(["pending", "approved", "suspended"], {
  errorMap: () => ({ message: "Invalid user status" })
});

// Base user schema without superRefine for extending
const baseUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long").transform(name => name.trim()),
  email: emailSchema,
  phone: phoneSchema,
  image: z.string().url("Invalid image URL").optional(),
  status: userStatusSchema.default("pending"),
  metadata: z.record(z.any()).optional(),
});

export const createUserSchema = baseUserSchema.superRefine((data, ctx) => {
  // Business rule: name should not contain only numbers
  if (/^\d+$/.test(data.name)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Name cannot contain only numbers",
      path: ["name"],
    });
  }
  
  // Business rule: validate name format
  if (data.name.length < 2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Name must be at least 2 characters",
      path: ["name"],
    });
  }
});

export const updateUserSchema = baseUserSchema.partial().extend({
  id: cuidSchema,
});

// ===== ORGANIZATION MEMBER SCHEMAS =====

export const createOrganizationMemberSchema = z.object({
  organizationId: cuidSchema,
  userId: cuidSchema.optional(), // Optional for invitations
  email: emailSchema.optional(), // For inviting new users
  role: organizationRoleSchema,
  permissions: z.array(z.object({
    action: permissionActionSchema,
    resource: resourceTypeSchema,
    conditions: z.record(z.any()).optional(),
  })).optional(),
  invitedBy: cuidSchema,
  metadata: z.record(z.any()).optional(),
}).superRefine((data, ctx) => {
  // Business rule: either userId or email must be provided
  if (!data.userId && !data.email) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Either userId or email must be provided",
      path: ["userId"],
    });
  }
  
  // Business rule: cannot provide both userId and email
  if (data.userId && data.email) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Cannot provide both userId and email",
      path: ["email"],
    });
  }
});

export const updateOrganizationMemberSchema = z.object({
  id: cuidSchema,
  organizationId: cuidSchema,
  role: organizationRoleSchema.optional(),
  permissions: z.array(z.object({
    action: permissionActionSchema,
    resource: resourceTypeSchema,
    conditions: z.record(z.any()).optional(),
  })).optional(),
  metadata: z.record(z.any()).optional(),
});

// ===== INVITATION SCHEMAS =====

export const invitationStatusSchema = z.enum(["pending", "accepted", "declined", "expired"], {
  errorMap: () => ({ message: "Invalid invitation status" })
});

export const createInvitationSchema = z.object({
  organizationId: cuidSchema,
  email: emailSchema,
  role: organizationRoleSchema,
  permissions: z.array(z.object({
    action: permissionActionSchema,
    resource: resourceTypeSchema,
    conditions: z.record(z.any()).optional(),
  })).optional(),
  message: z.string().max(500, "Invitation message too long").optional(),
  expiresAt: z.date().min(new Date(), "Expiration date must be in the future").optional(),
  sentBy: cuidSchema,
  metadata: z.record(z.any()).optional(),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, "Invitation token is required"),
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  phone: phoneSchema,
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  }),
});

export const declineInvitationSchema = z.object({
  token: z.string().min(1, "Invitation token is required"),
  reason: z.string().max(500, "Reason too long").optional(),
});

// ===== PERMISSION CHECK SCHEMAS =====

export const permissionCheckSchema = z.object({
  userId: cuidSchema,
  organizationId: cuidSchema,
  action: permissionActionSchema,
  resource: resourceTypeSchema,
  resourceId: cuidSchema.optional(),
  conditions: z.record(z.any()).optional(),
});

export const batchPermissionCheckSchema = z.object({
  userId: cuidSchema,
  organizationId: cuidSchema,
  checks: z.array(z.object({
    action: permissionActionSchema,
    resource: resourceTypeSchema,
    resourceId: cuidSchema.optional(),
    conditions: z.record(z.any()).optional(),
  })).min(1, "At least one permission check is required").max(50, "Too many permission checks"),
});

// ===== ROLE DEFINITION SCHEMAS =====

export const rolePermissionSchema = z.object({
  action: permissionActionSchema,
  resource: resourceTypeSchema,
  conditions: z.record(z.any()).optional(),
  description: z.string().max(200, "Description too long").optional(),
});

export const customRoleSchema = z.object({
  organizationId: cuidSchema,
  name: z.string().min(1, "Role name is required").max(50, "Role name too long"),
  description: z.string().max(200, "Description too long").optional(),
  permissions: z.array(rolePermissionSchema).min(1, "At least one permission is required"),
  isSystemRole: z.boolean().default(false),
  isActive: z.boolean().default(true),
  createdBy: cuidSchema,
});

// ===== AUTHENTICATION SCHEMAS =====

export const userAuthSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long").transform(name => name.trim()),
  email: emailSchema,
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number"),
  confirmPassword: z.string(),
  phone: phoneSchema,
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  }),
  acceptMarketing: z.boolean().default(false),
}).superRefine((data, ctx) => {
  // Business rule: passwords must match
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });
  }
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number"),
  confirmPassword: z.string(),
}).superRefine((data, ctx) => {
  // Business rule: new passwords must match
  if (data.newPassword !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "New passwords do not match",
      path: ["confirmPassword"],
    });
  }
  
  // Business rule: new password must be different from current
  if (data.currentPassword === data.newPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "New password must be different from current password",
      path: ["newPassword"],
    });
  }
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export const confirmResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number"),
  confirmPassword: z.string(),
}).superRefine((data, ctx) => {
  // Business rule: passwords must match
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });
  }
});

// ===== SESSION AND TOKEN SCHEMAS =====

export const sessionSchema = z.object({
  userId: cuidSchema,
  organizationId: cuidSchema.optional(),
  role: organizationRoleSchema.optional(),
  permissions: z.array(rolePermissionSchema).optional(),
  expiresAt: z.date(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().max(500).optional(),
  metadata: z.record(z.any()).optional(),
});

export const tokenSchema = z.object({
  type: z.enum(["access", "refresh", "invitation", "reset_password", "email_verification"]),
  userId: cuidSchema.optional(),
  organizationId: cuidSchema.optional(),
  expiresAt: z.date(),
  metadata: z.record(z.any()).optional(),
});

// ===== TYPE EXPORTS =====

export type OrganizationRole = z.infer<typeof organizationRoleSchema>;
export type PermissionAction = z.infer<typeof permissionActionSchema>;
export type ResourceType = z.infer<typeof resourceTypeSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateOrganizationMemberInput = z.infer<typeof createOrganizationMemberSchema>;
export type UpdateOrganizationMemberInput = z.infer<typeof updateOrganizationMemberSchema>;

export type InvitationStatus = z.infer<typeof invitationStatusSchema>;
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type DeclineInvitationInput = z.infer<typeof declineInvitationSchema>;

export type PermissionCheckInput = z.infer<typeof permissionCheckSchema>;
export type BatchPermissionCheckInput = z.infer<typeof batchPermissionCheckSchema>;

export type RolePermission = z.infer<typeof rolePermissionSchema>;
export type CustomRoleInput = z.infer<typeof customRoleSchema>;

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ConfirmResetPasswordInput = z.infer<typeof confirmResetPasswordSchema>;

export type SessionData = z.infer<typeof sessionSchema>;
export type TokenData = z.infer<typeof tokenSchema>;