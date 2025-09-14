import * as z from "zod";

// Base validation schemas
const organizationIdSchema = z.string().cuid("Invalid organization ID");
const positiveNumberSchema = z.number().positive("Must be greater than 0");
const uuidSchema = z.string().uuid().optional();

// Combo abbreviation - unique within organization, 2-15 chars, alphanumeric
const comboAbbreviationSchema = z
  .string()
  .min(2, "Abbreviation must be at least 2 characters")
  .max(15, "Abbreviation must be at most 15 characters")
  .regex(/^[A-Z0-9-]+$/, "Abbreviation must be uppercase alphanumeric with hyphens");

// Combo slug validation - URL-safe, lowercase, 3-100 chars
const comboSlugSchema = z
  .string()
  .min(3, "Slug must be at least 3 characters")
  .max(100, "Slug must be at most 100 characters")
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Slug must be lowercase alphanumeric with hyphens only"
  );

// Meta description for SEO
const metaDescriptionSchema = z
  .string()
  .min(10, "Meta description must be at least 10 characters")
  .max(160, "Meta description must be at most 160 characters");

// Tags validation (comma-separated)
const tagsSchema = z
  .string()
  .max(500, "Tags too long")
  .refine((tags) => {
    if (!tags.trim()) return true; // Empty tags are allowed
    const tagList = tags.split(",").map(tag => tag.trim());
    return tagList.every(tag => tag.length >= 2 && tag.length <= 50);
  }, "Each tag must be 2-50 characters long");

// Image alt text validation
const imageAltSchema = z
  .string()
  .min(1, "Image alt text is required")
  .max(200, "Image alt text must be at most 200 characters");

// ===== PRODUCT COMBO CATEGORIES =====
export const createProductComboCategorySchema = z.object({
  organizationId: organizationIdSchema,
  name: z.string().min(1, "Category name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  active: z.boolean().default(true),
  uuid: uuidSchema,
});

export const updateProductComboCategorySchema = createProductComboCategorySchema
  .partial()
  .omit({ organizationId: true });

// ===== PRODUCT COMBOS =====
export const createProductComboSchema = z.object({
  organizationId: organizationIdSchema,
  comboName: z.string().min(1, "Combo name is required").max(200, "Name too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description too long"),
  imageAlt: imageAltSchema,
  abbreviation: comboAbbreviationSchema,
  packagingId: z.string().cuid("Invalid packaging ID"),
  price: z
    .number()
    .positive("Price must be greater than 0")
    .max(999999.99, "Price too large")
    .multipleOf(0.01, "Price must have at most 2 decimal places"),
  active: z.boolean().default(true),
  modalQuick: z.boolean().default(false),
  categoryId: z.string().cuid("Invalid category ID"),
  slug: comboSlugSchema,
  metaDescription: metaDescriptionSchema,
  tags: tagsSchema,
  uuid: uuidSchema,
});

export const updateProductComboSchema = createProductComboSchema.partial().omit({ organizationId: true });

// Combo with products schema
export const comboWithProductsSchema = createProductComboSchema.extend({
  products: z.array(z.object({
    productId: z.string().cuid("Invalid product ID"),
    quantity: positiveNumberSchema.int("Quantity must be a positive integer"),
  })).min(1, "Combo must include at least one product"),
  allowedCategories: z.array(z.object({
    categoryId: z.string().cuid("Invalid category ID"),
    ruleId: z.string().cuid("Invalid rule ID").optional(),
    isRequired: z.boolean().default(false),
  })).optional(),
  excludedProducts: z.array(z.string().cuid()).optional(),
});

// ===== COMBO PRODUCTS =====
export const createComboProductSchema = z.object({
  organizationId: organizationIdSchema,
  comboId: z.string().cuid("Invalid combo ID"),
  productId: z.string().cuid("Invalid product ID"),
  quantity: positiveNumberSchema.int("Quantity must be a positive integer"),
});

export const updateComboProductSchema = z.object({
  quantity: positiveNumberSchema.int("Quantity must be a positive integer"),
});

// Bulk update combo products
export const bulkUpdateComboProductsSchema = z.object({
  organizationId: organizationIdSchema,
  comboId: z.string().cuid("Invalid combo ID"),
  products: z.array(z.object({
    productId: z.string().cuid("Invalid product ID"),
    quantity: positiveNumberSchema.int("Quantity must be a positive integer"),
  })).min(1, "Combo must include at least one product"),
});

// ===== STATE STRATEGIES =====
export const createStateStrategySchema = z.object({
  organizationId: organizationIdSchema,
  name: z.string().min(1, "Strategy name is required").max(100, "Name too long"),
  strategy: z.string().min(1, "Strategy is required").max(50, "Strategy too long"),
  description: z.string().min(1, "Description is required").max(500, "Description too long"),
});

export const updateStateStrategySchema = createStateStrategySchema.partial().omit({ organizationId: true });

// ===== PRODUCT RULES =====
export const createProductRuleSchema = z.object({
  organizationId: organizationIdSchema,
  name: z.string().min(1, "Rule name is required").max(100, "Name too long"),
  strategyId: z.string().cuid("Invalid strategy ID"),
  limit: positiveNumberSchema.int("Limit must be a positive integer").optional(),
  exempt: z.number().int().min(0, "Exempt must be 0 or greater").optional(),
  alert: z.string().max(200, "Alert message too long").optional(),
});

export const updateProductRuleSchema = createProductRuleSchema.partial().omit({ organizationId: true });

// ===== COMBO ALLOWED CATEGORIES =====
export const createComboAllowedCategorySchema = z.object({
  organizationId: organizationIdSchema,
  comboId: z.string().cuid("Invalid combo ID"),
  categoryId: z.string().cuid("Invalid category ID"),
  ruleId: z.string().cuid("Invalid rule ID").optional(),
  isRequired: z.boolean().default(false),
});

export const updateComboAllowedCategorySchema = z.object({
  ruleId: z.string().cuid("Invalid rule ID").optional(),
  isRequired: z.boolean().optional(),
});

// ===== COMBO PRODUCT EXCLUDES =====
export const createComboProductExcludeSchema = z.object({
  organizationId: organizationIdSchema,
  comboId: z.string().cuid("Invalid combo ID"),
  productId: z.string().cuid("Invalid product ID"),
});

// ===== QUERY SCHEMAS =====
export const comboListQuerySchema = z.object({
  organizationId: organizationIdSchema,
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().max(100).optional(),
  categoryId: z.string().cuid().optional(),
  active: z.coerce.boolean().optional(),
  modalQuick: z.coerce.boolean().optional(),
  sortBy: z.enum(["comboName", "price", "createdAt", "updatedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const comboSearchSchema = z.object({
  organizationId: organizationIdSchema,
  query: z.string().min(1, "Search query is required").max(100, "Query too long"),
  categoryIds: z.array(z.string().cuid()).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
});

// Public combo lookup (for SEO-friendly URLs)
export const publicComboLookupSchema = z.object({
  organizationSlug: z.string().min(3).max(50),
  comboSlug: comboSlugSchema,
});

// ===== SOFT DELETE SCHEMAS =====
export const softDeleteComboSchema = z.object({
  id: z.string().cuid("Invalid combo ID"),
  organizationId: organizationIdSchema,
});

export const restoreComboSchema = softDeleteComboSchema;

// ===== COMBO VALIDATION RULES =====
export const validateComboBusinessRulesSchema = z.object({
  organizationId: organizationIdSchema,
  comboId: z.string().cuid("Invalid combo ID"),
  selectedProducts: z.array(z.object({
    productId: z.string().cuid("Invalid product ID"),
    quantity: positiveNumberSchema.int(),
  })),
});

// Type exports
export type CreateProductComboCategoryInput = z.infer<typeof createProductComboCategorySchema>;
export type UpdateProductComboCategoryInput = z.infer<typeof updateProductComboCategorySchema>;
export type CreateProductComboInput = z.infer<typeof createProductComboSchema>;
export type UpdateProductComboInput = z.infer<typeof updateProductComboSchema>;
export type ComboWithProductsInput = z.infer<typeof comboWithProductsSchema>;
export type CreateComboProductInput = z.infer<typeof createComboProductSchema>;
export type UpdateComboProductInput = z.infer<typeof updateComboProductSchema>;
export type BulkUpdateComboProductsInput = z.infer<typeof bulkUpdateComboProductsSchema>;
export type CreateStateStrategyInput = z.infer<typeof createStateStrategySchema>;
export type UpdateStateStrategyInput = z.infer<typeof updateStateStrategySchema>;
export type CreateProductRuleInput = z.infer<typeof createProductRuleSchema>;
export type UpdateProductRuleInput = z.infer<typeof updateProductRuleSchema>;
export type CreateComboAllowedCategoryInput = z.infer<typeof createComboAllowedCategorySchema>;
export type UpdateComboAllowedCategoryInput = z.infer<typeof updateComboAllowedCategorySchema>;
export type CreateComboProductExcludeInput = z.infer<typeof createComboProductExcludeSchema>;
export type ComboListQueryInput = z.infer<typeof comboListQuerySchema>;
export type ComboSearchInput = z.infer<typeof comboSearchSchema>;
export type PublicComboLookupInput = z.infer<typeof publicComboLookupSchema>;
export type SoftDeleteComboInput = z.infer<typeof softDeleteComboSchema>;
export type RestoreComboInput = z.infer<typeof restoreComboSchema>;
export type ValidateComboBusinessRulesInput = z.infer<typeof validateComboBusinessRulesSchema>;
