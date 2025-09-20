// Export all validation schemas and types
export * from "./auth";
export { userNameSchema, userRoleSchema as userRoleUpdateSchema } from "./user";
// Don't export all from organization to avoid conflicts with auth
export * from "./product";
export * from "./combo";
export * from "./common";
export * from "./audit";

// Re-export commonly used schemas for convenience
export {
  createOrganizationSchema,
  updateOrganizationSchema,
  organizationContextSchema,
  type CreateOrganizationInput,
  type UpdateOrganizationInput,
  type OrganizationContextInput,
} from "./organization";

export {
  createProductSchema,
  updateProductSchema,
  productListQuerySchema,
  createProductCategorySchema,
  type CreateProductInput,
  type UpdateProductInput,
  type ProductListQueryInput,
  type CreateProductCategoryInput,
} from "./product";

export {
  createProductComboSchema,
  updateProductComboSchema,
  comboListQuerySchema,
  comboWithProductsSchema,
  type CreateProductComboInput,
  type UpdateProductComboInput,
  type ComboListQueryInput,
  type ComboWithProductsInput,
} from "./combo";

export {
  paginatedQuerySchema,
  successResponseSchema,
  errorResponseSchema,
  paginatedResponseSchema,
  type PaginatedQuery,
  type SuccessResponse,
  type ErrorResponse,
  type PaginatedResponse,
} from "./common";
