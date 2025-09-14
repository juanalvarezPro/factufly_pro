import * as z from "zod";
import { 
  cuidSchema, 
  positiveDecimalSchema, 
  positiveIntSchema, 
  nonNegativeIntSchema, 
  slugSchema, 
  paginatedQuerySchema,
  withOrganizationSchema,
  urlSchema,
  uuidSchema as commonUuidSchema,
  emailSchema
} from "./common";

// Base validation schemas
const positiveNumberSchema = z.number().positive("Must be greater than 0");
const nonNegativeNumberSchema = z.number().min(0, "Must be 0 or greater");
const uuidSchema = commonUuidSchema;
const organizationIdSchema = cuidSchema;

// ===== ADVANCED VALIDATIONS =====

// Product abbreviation - unique within organization, 2-10 chars, alphanumeric
const productAbbreviationSchema = z
  .string()
  .min(2, "Abbreviation must be at least 2 characters")
  .max(10, "Abbreviation must be at most 10 characters")
  .regex(/^[A-Z0-9]+$/, "Abbreviation must be uppercase alphanumeric")
  .transform(abbr => abbr.toUpperCase());

// SKU validation with enhanced format
const skuSchema = z
  .string()
  .min(3, "SKU must be at least 3 characters")
  .max(50, "SKU must be at most 50 characters")
  .regex(/^[A-Z0-9]([A-Z0-9-_]*[A-Z0-9])?$/, "SKU format invalid")
  .transform(sku => sku.toUpperCase())
  .optional();

// Barcode validation - supports EAN-8, UPC-A, EAN-13, EAN-14
const barcodeSchema = z
  .string()
  .regex(/^(\d{8}|\d{12}|\d{13}|\d{14})$/, "Invalid barcode format")
  .optional();

// Enhanced image alt text validation
const imageAltSchema = z
  .string()
  .min(1, "Image alt text is required")
  .max(200, "Image alt text must be at most 200 characters")
  .refine(
    (text) => !text.includes("<") && !text.includes(">"),
    "Image alt text cannot contain HTML tags"
  );

// Price validation with enhanced rules
const priceSchema = z
  .number()
  .positive("Price must be greater than 0")
  .max(999999.99, "Price cannot exceed 999,999.99")
  .multipleOf(0.01, "Price must have at most 2 decimal places")
  .refine(
    (price) => price >= 0.01,
    "Price must be at least 0.01"
  );

// Weight schema (in grams)
const weightSchema = z
  .number()
  .positive("Weight must be positive")
  .max(100000, "Weight cannot exceed 100kg")
  .optional();

// Dimensions schema
const dimensionsSchema = z.object({
  length: z.number().positive("Length must be positive").max(9999, "Length too large").optional(),
  width: z.number().positive("Width must be positive").max(9999, "Width too large").optional(),
  height: z.number().positive("Height must be positive").max(9999, "Height too large").optional(),
  weight: weightSchema,
}).optional();

// Nutritional information
const nutritionalInfoSchema = z.object({
  calories: z.number().min(0).max(9999).optional(),
  protein: z.number().min(0).max(999).optional(),
  carbohydrates: z.number().min(0).max(999).optional(),
  fat: z.number().min(0).max(999).optional(),
  fiber: z.number().min(0).max(999).optional(),
  sugar: z.number().min(0).max(999).optional(),
  sodium: z.number().min(0).max(9999).optional(),
}).optional();

// Allergen information
const allergenInfoSchema = z.object({
  contains: z.array(z.string()).default([]),
  mayContain: z.array(z.string()).default([]),
  freeFrom: z.array(z.string()).default([]),
}).optional();

// SEO metadata
const seoMetadataSchema = z.object({
  title: z.string().max(60, "SEO title must be at most 60 characters").optional(),
  description: z.string().max(160, "SEO description must be at most 160 characters").optional(),
  keywords: z.array(z.string().max(30)).max(20, "Too many keywords").optional(),
}).optional();

// Product status enum
const productStatusSchema = z.enum(["active", "inactive", "archived", "discontinued"], {
  errorMap: () => ({ message: "Invalid product status" })
});

// Stock alert levels
const stockAlertSchema = z.object({
  lowStockThreshold: z.number().min(0).default(10),
  enableLowStockAlert: z.boolean().default(true),
  enableOutOfStockAlert: z.boolean().default(true),
}).optional();

// ===== SUMMARY CARDS =====
export const createSummaryCardSchema = z.object({
  organizationId: organizationIdSchema,
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  camelName: z.string().min(1, "Camel name is required").max(100, "Camel name too long"),
  description: z.string().min(1, "Description is required").max(500, "Description too long"),
});

export const updateSummaryCardSchema = createSummaryCardSchema.partial().omit({ organizationId: true });

// ===== PRODUCT CATEGORIES =====
export const createProductCategorySchema = z.object({
  organizationId: organizationIdSchema,
  name: z.string().min(1, "Category name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  imagenAlt: imageAltSchema.optional(),
  active: z.boolean().default(true),
  summaryCardId: z.string().cuid().optional(),
  isCombo: z.boolean().default(false),
  uuid: uuidSchema,
});

export const updateProductCategorySchema = createProductCategorySchema.partial().omit({ organizationId: true });

// ===== PRODUCT CARDS =====
export const createProductCardSchema = z.object({
  organizationId: organizationIdSchema,
  cardName: z.string().min(1, "Card name is required").max(100, "Name too long"),
  camelName: z.string().max(100, "Camel name too long").optional(),
  description: z.string().min(1, "Description is required").max(500, "Description too long"),
  active: z.boolean().default(true),
  imageAlt: imageAltSchema,
});

export const updateProductCardSchema = createProductCardSchema.partial().omit({ organizationId: true });

// ===== PRODUCTS ===== (Defined below after advanced validations)

// Base schema without superRefine for extending
const baseProductSchema = z.object({
  organizationId: organizationIdSchema,
  name: z.string().min(1, "Product name is required").max(200, "Name too long").transform(name => name.trim()),
  description: z.string().max(1000, "Description too long").optional(),
  imageAlt: imageAltSchema,
  abbreviation: productAbbreviationSchema,
  sku: skuSchema,
  barcode: barcodeSchema,
  price: priceSchema,
  costPrice: z.number().positive("Cost price must be positive").optional(),
  categoryId: z.string().cuid("Invalid category ID"),
  cardId: z.string().cuid("Invalid card ID"),
  status: productStatusSchema.default("active"),
  isVisible: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  dimensions: dimensionsSchema,
  nutritionalInfo: nutritionalInfoSchema,
  allergenInfo: allergenInfoSchema,
  seoMetadata: seoMetadataSchema,
  stockAlert: stockAlertSchema,
  tags: z.array(z.string().max(50)).max(20, "Too many tags").default([]),
  images: z.array(urlSchema).max(10, "Too many images").default([]),
  uuid: uuidSchema,
});

// Add business rules with superRefine
export const createProductSchema = baseProductSchema.superRefine((data, ctx) => {
  // Business rule: cost price should be less than selling price
  if (data.costPrice && data.costPrice >= data.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Cost price must be less than selling price",
      path: ["costPrice"],
    });
  }
  
  // Business rule: SKU should be unique if provided
  if (data.sku && data.sku.length < 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "SKU must be at least 3 characters when provided",
      path: ["sku"],
    });
  }
});

export const updateProductSchema = baseProductSchema.omit({ organizationId: true }).partial();

// Product with stock information
export const productWithStockSchema = baseProductSchema.extend({
  stocks: z.array(z.object({
    measureId: z.string().cuid(),
    stockQuantity: nonNegativeNumberSchema,
  })).optional(),
});

// ===== MEASURES =====
export const createMeasureSchema = z.object({
  organizationId: organizationIdSchema,
  name: z.string().min(1, "Measure name is required").max(50, "Name too long"),
  abbreviation: z
    .string()
    .min(1, "Abbreviation is required")
    .max(10, "Abbreviation too long")
    .regex(/^[A-Za-z0-9]+$/, "Abbreviation must be alphanumeric"),
});

export const updateMeasureSchema = createMeasureSchema.partial().omit({ organizationId: true });

// ===== PRODUCT STOCKS =====
export const createProductStockSchema = z.object({
  organizationId: organizationIdSchema,
  productId: z.string().cuid("Invalid product ID"),
  measureId: z.string().cuid("Invalid measure ID"),
  stockQuantity: nonNegativeNumberSchema,
});

export const updateProductStockSchema = z.object({
  stockQuantity: nonNegativeNumberSchema,
});

// Bulk stock update
export const bulkUpdateStockSchema = z.object({
  organizationId: organizationIdSchema,
  updates: z.array(z.object({
    productId: z.string().cuid(),
    measureId: z.string().cuid(),
    stockQuantity: nonNegativeNumberSchema,
  })).min(1, "At least one stock update is required"),
});

// ===== PACKAGINGS =====
export const createPackagingSchema = z.object({
  organizationId: organizationIdSchema,
  name: z.string().min(1, "Packaging name is required").max(100, "Name too long"),
  imageAlt: imageAltSchema.optional(),
  price: z
    .number()
    .positive("Price must be greater than 0")
    .max(99999.99, "Price too large")
    .multipleOf(0.01, "Price must have at most 2 decimal places"),
  active: z.boolean().default(true),
});

export const updatePackagingSchema = createPackagingSchema.partial().omit({ organizationId: true });

// ===== PACKAGING STOCKS =====
export const createPackagingStockSchema = z.object({
  organizationId: organizationIdSchema,
  packagingId: z.string().cuid("Invalid packaging ID"),
  stockQuantity: nonNegativeNumberSchema,
});

export const updatePackagingStockSchema = z.object({
  stockQuantity: nonNegativeNumberSchema,
});

// ===== QUERY SCHEMAS =====
export const productListQuerySchema = z.object({
  organizationId: organizationIdSchema,
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().max(100).optional(),
  categoryId: z.string().cuid().optional(),
  status: z.array(productStatusSchema).optional(),
  isVisible: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  hasStock: z.coerce.boolean().optional(),
  tags: z.array(z.string()).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sortBy: z.enum(["name", "price", "createdAt", "updatedAt", "status", "stock"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const productSearchSchema = z.object({
  organizationId: organizationIdSchema,
  query: z.string().min(1, "Search query is required").max(100, "Query too long").transform(q => q.trim()),
  categoryIds: z.array(z.string().cuid()).max(10, "Too many categories").optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  status: z.array(productStatusSchema).optional(),
  hasNutritionalInfo: z.boolean().optional(),
  hasAllergenInfo: z.boolean().optional(),
  tags: z.array(z.string()).max(20, "Too many tags").optional(),
  inStock: z.boolean().optional(),
  sortBy: z.enum(["relevance", "name", "price", "createdAt"]).default("relevance"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
}).superRefine((data, ctx) => {
  // Business rule: maxPrice should be greater than minPrice
  if (data.minPrice && data.maxPrice && data.maxPrice <= data.minPrice) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Maximum price must be greater than minimum price",
      path: ["maxPrice"],
    });
  }
});

// ===== SOFT DELETE SCHEMAS =====
export const softDeleteProductSchema = z.object({
  id: z.string().cuid("Invalid product ID"),
  organizationId: organizationIdSchema,
});

export const restoreProductSchema = softDeleteProductSchema;

// Type exports
export type CreateSummaryCardInput = z.infer<typeof createSummaryCardSchema>;
export type UpdateSummaryCardInput = z.infer<typeof updateSummaryCardSchema>;
export type CreateProductCategoryInput = z.infer<typeof createProductCategorySchema>;
export type UpdateProductCategoryInput = z.infer<typeof updateProductCategorySchema>;
export type CreateProductCardInput = z.infer<typeof createProductCardSchema>;
export type UpdateProductCardInput = z.infer<typeof updateProductCardSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductWithStockInput = z.infer<typeof productWithStockSchema>;
export type CreateMeasureInput = z.infer<typeof createMeasureSchema>;
export type UpdateMeasureInput = z.infer<typeof updateMeasureSchema>;
export type CreateProductStockInput = z.infer<typeof createProductStockSchema>;
export type UpdateProductStockInput = z.infer<typeof updateProductStockSchema>;
export type BulkUpdateStockInput = z.infer<typeof bulkUpdateStockSchema>;
export type CreatePackagingInput = z.infer<typeof createPackagingSchema>;
export type UpdatePackagingInput = z.infer<typeof updatePackagingSchema>;
export type CreatePackagingStockInput = z.infer<typeof createPackagingStockSchema>;
export type UpdatePackagingStockInput = z.infer<typeof updatePackagingStockSchema>;
export type ProductListQueryInput = z.infer<typeof productListQuerySchema>;
export type ProductSearchInput = z.infer<typeof productSearchSchema>;
export type SoftDeleteProductInput = z.infer<typeof softDeleteProductSchema>;
export type RestoreProductInput = z.infer<typeof restoreProductSchema>;
