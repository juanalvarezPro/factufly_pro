import * as z from "zod";

// ===== COMMON VALIDATION PATTERNS =====

export const cuidSchema = z.string().cuid("Invalid ID format");
export const uuidSchema = z.string().uuid("Invalid UUID format");

// Email schema with proper validation and normalization
export const emailSchema = z
  .string()
  .email("Invalid email format")
  .max(255, "Email must be at most 255 characters")
  .transform(email => email.toLowerCase().trim())
  .refine(
    (email) => !email.includes("+") || email.includes("@"),
    "Invalid email format"
  );

// URL schema with proper validation
export const urlSchema = z
  .string()
  .url("Invalid URL format")
  .max(2048, "URL must be at most 2048 characters")
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return ["http:", "https:"].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    "URL must use HTTP or HTTPS protocol"
  );

// Phone schema with international format support
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
  .optional();

// Enhanced text schemas
export const shortTextSchema = z
  .string()
  .min(1, "Field is required")
  .max(255, "Text must be at most 255 characters")
  .transform(text => text.trim())
  .refine(
    (text) => text.length > 0,
    "Field cannot be empty"
  );

export const mediumTextSchema = z
  .string()
  .min(1, "Field is required")
  .max(1000, "Text must be at most 1000 characters")
  .transform(text => text.trim());

export const longTextSchema = z
  .string()
  .max(5000, "Text must be at most 5000 characters")
  .transform(text => text.trim())
  .optional();

// Color hex schema
export const colorHexSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color format");

// Weight schema in grams
export const weightSchema = z
  .number()
  .positive("Weight must be positive")
  .max(100000, "Weight cannot exceed 100kg"); // 100kg in grams

// Positive number with max decimal places
export const positiveDecimalSchema = (maxDecimals = 2) =>
  z.number().positive("Must be greater than 0").multipleOf(
    1 / Math.pow(10, maxDecimals),
    `Must have at most ${maxDecimals} decimal places`
  );

// Non-negative integer
export const nonNegativeIntSchema = z.number().int().min(0, "Must be 0 or greater");

// Positive integer
export const positiveIntSchema = z.number().int().positive("Must be greater than 0");

// Slug validation - URL-safe
export const slugSchema = (minLength = 3, maxLength = 100) =>
  z
    .string()
    .min(minLength, `Slug must be at least ${minLength} characters`)
    .max(maxLength, `Slug must be at most ${maxLength} characters`)
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens only"
    );

// ===== PAGINATION SCHEMAS =====

export const paginationQuerySchema = z.object({
  page: z.coerce.number().min(1, "Page must be at least 1").default(1),
  limit: z.coerce.number().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100").default(10),
});

export const sortQuerySchema = z.object({
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const searchQuerySchema = z.object({
  search: z.string().max(100, "Search query too long").optional(),
});

export const paginatedQuerySchema = paginationQuerySchema
  .merge(sortQuerySchema)
  .merge(searchQuerySchema);

// ===== API RESPONSE SCHEMAS =====

export const successResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
  });

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.any()).optional(),
  }),
});

export const paginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  successResponseSchema(
    z.object({
      items: z.array(itemSchema),
      pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
        hasNext: z.boolean(),
        hasPrev: z.boolean(),
      }),
    })
  );

// API response union
export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.union([successResponseSchema(dataSchema), errorResponseSchema]);

// ===== VALIDATION ERROR HANDLING =====

export const validationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string(),
});

export const validationErrorsResponseSchema = errorResponseSchema.extend({
  error: errorResponseSchema.shape.error.extend({
    code: z.literal("VALIDATION_ERROR"),
    validationErrors: z.array(validationErrorSchema),
  }),
});

// ===== FILE UPLOAD SCHEMAS =====

export const imageUploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size <= 5 * 1024 * 1024, // 5MB
    "File size must be less than 5MB"
  ).refine(
    (file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
    "File must be JPEG, PNG, or WebP"
  ),
  organizationId: cuidSchema,
  entityType: z.enum(["product", "combo", "packaging", "organization"]),
  entityId: cuidSchema.optional(),
});

export const imageUrlSchema = z.object({
  url: urlSchema,
  alt: z.string().min(1, "Alt text is required").max(200, "Alt text too long"),
  width: positiveIntSchema.optional(),
  height: positiveIntSchema.optional(),
});

// ===== ORGANIZATION CONTEXT VALIDATION =====

export const withOrganizationSchema = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) =>
  schema.extend({
    organizationId: cuidSchema,
  });

// ===== BATCH OPERATION SCHEMAS =====

export const batchDeleteSchema = z.object({
  ids: z.array(cuidSchema).min(1, "At least one ID is required").max(100, "Too many IDs"),
  organizationId: cuidSchema,
});

export const batchUpdateSchema = <T extends z.ZodType>(updateSchema: T) =>
  z.object({
    updates: z.array(
      z.object({
        id: cuidSchema,
        data: updateSchema,
      })
    ).min(1, "At least one update is required").max(100, "Too many updates"),
    organizationId: cuidSchema,
  });

// ===== AUDIT SCHEMAS =====

export const auditLogSchema = z.object({
  action: z.enum(["CREATE", "UPDATE", "DELETE", "RESTORE", "ARCHIVE"]),
  entityType: z.string(),
  entityId: cuidSchema,
  organizationId: cuidSchema,
  userId: cuidSchema,
  changes: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  timestamp: z.date().default(() => new Date()),
});

// ===== FEATURE FLAGS =====

export const featureFlagSchema = z.object({
  key: z.string(),
  enabled: z.boolean(),
  organizationId: cuidSchema.optional(), // Global if not specified
  metadata: z.record(z.any()).optional(),
});

// Type exports
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type SortQuery = z.infer<typeof sortQuerySchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type PaginatedQuery = z.infer<typeof paginatedQuerySchema>;

export type SuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

export type PaginatedResponse<T> = SuccessResponse<{
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}>;

export type ValidationError = z.infer<typeof validationErrorSchema>;
export type ValidationErrorsResponse = z.infer<typeof validationErrorsResponseSchema>;

export type ImageUpload = z.infer<typeof imageUploadSchema>;
export type ImageUrl = z.infer<typeof imageUrlSchema>;

export type BatchDelete = z.infer<typeof batchDeleteSchema>;
export type BatchUpdate<T> = {
  updates: Array<{ id: string; data: T }>;
  organizationId: string;
};

export type AuditLog = z.infer<typeof auditLogSchema>;
export type FeatureFlag = z.infer<typeof featureFlagSchema>;
