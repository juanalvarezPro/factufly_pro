import type { Prisma } from "@prisma/client";
import type * as z from "zod";

// Import all validation schemas
import type {
  CreateProductInput,
  UpdateProductInput,
  ProductListQueryInput,
  CreateProductCategoryInput,
  UpdateProductCategoryInput,
  CreatePackagingInput,
  UpdatePackagingInput,
} from "../validations/product";

import type {
  CreateProductComboInput,
  UpdateProductComboInput,
  ComboListQueryInput,
} from "../validations/combo";

import type {
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from "../validations/organization";

import type {
  CreateUserInput,
  UpdateUserInput,
  OrganizationRole,
  PermissionAction,
  ResourceType,
} from "../validations/auth";

// ===== STRICT TYPE MAPPINGS =====

/**
 * Ensures validation input types match Prisma create types
 */
export type StrictCreateProduct = CreateProductInput & {
  // Additional runtime validations
  readonly _brand: "StrictCreateProduct";
};

export type StrictUpdateProduct = UpdateProductInput & {
  readonly _brand: "StrictUpdateProduct";
};

/**
 * Ensures query types are properly typed
 */
export type StrictProductQuery = ProductListQueryInput & {
  readonly _brand: "StrictProductQuery";
};

/**
 * Database result types with strict typing
 */
export type StrictProductResult = Prisma.ProductGetPayload<{
  include: {
    organization: true;
    category: true;
    card: true;
    stocks: {
      include: {
        measure: true;
      };
    };
  };
}> & {
  readonly _brand: "StrictProductResult";
};

export type StrictProductComboResult = Prisma.ProductComboGetPayload<{
  include: {
    organization: true;
    category: true;
    packaging: true;
    comboProducts: {
      include: {
        product: {
          include: {
            category: true;
            card: true;
          };
        };
      };
    };
  };
}> & {
  readonly _brand: "StrictProductComboResult";
};

export type StrictOrganizationResult = Prisma.OrganizationGetPayload<{
  include: {
    owner: true;
    members: {
      include: {
        user: true;
      };
    };
    subscription: true;
  };
}> & {
  readonly _brand: "StrictOrganizationResult";
};

// ===== API RESPONSE TYPES =====

export interface StrictApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    validationErrors?: Array<{
      field: string;
      message: string;
      code: string;
    }>;
  };
  message?: string;
}

export interface StrictPaginatedResponse<T> extends StrictApiResponse<{
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {}

// ===== VALIDATION RESULT TYPES =====

export interface StrictValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Array<{
    path: (string | number)[];
    message: string;
    code: string;
  }>;
}

export interface StrictValidatedRequest<
  TBody = any,
  TQuery = any,
  TParams = any,
  THeaders = any
> {
  body?: TBody;
  query?: TQuery;
  params?: TParams;
  headers?: THeaders;
}

// ===== SERVICE OPERATION TYPES =====

export interface StrictServiceOptions {
  userId: string;
  organizationId: string;
  userRole?: OrganizationRole;
  permissions?: Array<{
    action: PermissionAction;
    resource: ResourceType;
  }>;
}

export interface StrictCreateOptions extends StrictServiceOptions {
  validateUnique?: boolean;
  skipAudit?: boolean;
}

export interface StrictUpdateOptions extends StrictServiceOptions {
  allowPartial?: boolean;
  skipVersionCheck?: boolean;
  skipAudit?: boolean;
}

export interface StrictDeleteOptions extends StrictServiceOptions {
  softDelete?: boolean;
  cascade?: boolean;
  skipAudit?: boolean;
}

export interface StrictQueryOptions extends StrictServiceOptions {
  includeSoftDeleted?: boolean;
  includeRelations?: string[];
  maxResults?: number;
}

// ===== ERROR TYPES =====

export class StrictValidationError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly validationErrors: Array<{
    field: string;
    message: string;
    code: string;
  }>;

  constructor(
    message: string,
    validationErrors: Array<{ field: string; message: string; code: string }>,
    code: string = "VALIDATION_ERROR",
    statusCode: number = 400
  ) {
    super(message);
    this.name = "StrictValidationError";
    this.code = code;
    this.statusCode = statusCode;
    this.validationErrors = validationErrors;
  }
}

export class StrictPermissionError extends Error {
  public readonly code: string = "PERMISSION_DENIED";
  public readonly statusCode: number = 403;
  public readonly requiredPermission: {
    action: PermissionAction;
    resource: ResourceType;
  };

  constructor(
    message: string,
    requiredPermission: { action: PermissionAction; resource: ResourceType }
  ) {
    super(message);
    this.name = "StrictPermissionError";
    this.requiredPermission = requiredPermission;
  }
}

export class StrictBusinessRuleError extends Error {
  public readonly code: string;
  public readonly statusCode: number = 422;
  public readonly ruleViolated: string;

  constructor(message: string, ruleViolated: string, code: string = "BUSINESS_RULE_VIOLATION") {
    super(message);
    this.name = "StrictBusinessRuleError";
    this.code = code;
    this.ruleViolated = ruleViolated;
  }
}

// ===== UTILITY TYPES =====

/**
 * Extract the validation schema type from a Zod schema
 */
export type InferStrictType<T extends z.ZodType> = z.infer<T>;

/**
 * Make all properties required and readonly for immutable operations
 */
export type StrictImmutable<T> = {
  readonly [K in keyof T]-?: T[K];
};

/**
 * Make specific properties required
 */
export type StrictRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Ensure type compatibility between validation and Prisma types
 */
export type StrictCompatible<TValidation, TPrisma> = TValidation extends TPrisma
  ? TValidation
  : never;

/**
 * Type-safe partial update type
 */
export type StrictPartialUpdate<T> = Partial<Omit<T, "id" | "createdAt" | "updatedAt">> & {
  id: string;
  updatedAt?: Date;
};

// ===== CONSTRAINT TYPES =====

/**
 * Ensures string fields have minimum length
 */
export type StrictNonEmptyString = string & { readonly _brand: "NonEmptyString" };

/**
 * Ensures numeric fields are positive
 */
export type StrictPositiveNumber = number & { readonly _brand: "PositiveNumber" };

/**
 * Ensures CUID format
 */
export type StrictCUID = string & { readonly _brand: "CUID" };

/**
 * Ensures UUID format
 */
export type StrictUUID = string & { readonly _brand: "UUID" };

/**
 * Ensures email format
 */
export type StrictEmail = string & { readonly _brand: "Email" };

/**
 * Ensures URL format
 */
export type StrictURL = string & { readonly _brand: "URL" };

// ===== RUNTIME TYPE GUARDS =====

export function isStrictNonEmptyString(value: unknown): value is StrictNonEmptyString {
  return typeof value === "string" && value.trim().length > 0;
}

export function isStrictPositiveNumber(value: unknown): value is StrictPositiveNumber {
  return typeof value === "number" && value > 0 && !isNaN(value) && isFinite(value);
}

export function isStrictCUID(value: unknown): value is StrictCUID {
  return typeof value === "string" && /^c[0-9a-z]{24}$/.test(value);
}

export function isStrictUUID(value: unknown): value is StrictUUID {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function isStrictEmail(value: unknown): value is StrictEmail {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isStrictURL(value: unknown): value is StrictURL {
  try {
    if (typeof value !== "string") return false;
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

// ===== TYPE ASSERTION HELPERS =====

export function assertStrictType<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  errorMessage: string
): asserts value is T {
  if (!guard(value)) {
    throw new StrictValidationError(errorMessage, [
      { field: "value", message: errorMessage, code: "TYPE_ASSERTION_FAILED" }
    ]);
  }
}

export function castToStrictType<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  fallback: T
): T {
  return guard(value) ? value : fallback;
}

// ===== BRANDED TYPE CREATORS =====

export function createStrictNonEmptyString(value: string): StrictNonEmptyString {
  if (!isStrictNonEmptyString(value)) {
    throw new StrictValidationError("Value must be a non-empty string", [
      { field: "value", message: "Must be a non-empty string", code: "INVALID_STRING" }
    ]);
  }
  return value as StrictNonEmptyString;
}

export function createStrictPositiveNumber(value: number): StrictPositiveNumber {
  if (!isStrictPositiveNumber(value)) {
    throw new StrictValidationError("Value must be a positive number", [
      { field: "value", message: "Must be a positive number", code: "INVALID_NUMBER" }
    ]);
  }
  return value as StrictPositiveNumber;
}

export function createStrictCUID(value: string): StrictCUID {
  if (!isStrictCUID(value)) {
    throw new StrictValidationError("Value must be a valid CUID", [
      { field: "value", message: "Must be a valid CUID", code: "INVALID_CUID" }
    ]);
  }
  return value as StrictCUID;
}

export function createStrictEmail(value: string): StrictEmail {
  if (!isStrictEmail(value)) {
    throw new StrictValidationError("Value must be a valid email", [
      { field: "value", message: "Must be a valid email", code: "INVALID_EMAIL" }
    ]);
  }
  return value.toLowerCase().trim() as StrictEmail;
}

export function createStrictURL(value: string): StrictURL {
  if (!isStrictURL(value)) {
    throw new StrictValidationError("Value must be a valid URL", [
      { field: "value", message: "Must be a valid URL", code: "INVALID_URL" }
    ]);
  }
  return value as StrictURL;
}

// ===== COMPOSITION HELPERS =====

/**
 * Compose multiple type guards
 */
export function composeGuards<T, U extends T>(
  guardA: (value: unknown) => value is T,
  guardB: (value: T) => value is U
) {
  return (value: unknown): value is U => guardA(value) && guardB(value);
}

/**
 * Create a validator that ensures all array items match a type guard
 */
export function arrayOf<T>(guard: (value: unknown) => value is T) {
  return (value: unknown): value is T[] => {
    return Array.isArray(value) && value.every(guard);
  };
}

/**
 * Create a validator for object with specific property types
 */
export function objectWith<T extends Record<string, any>>(
  guards: { [K in keyof T]: (value: unknown) => value is T[K] }
) {
  return (value: unknown): value is T => {
    if (!value || typeof value !== "object") return false;
    
    const obj = value as any;
    return Object.entries(guards).every(([key, guard]) => {
      return guard(obj[key]);
    });
  };
}
