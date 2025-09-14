import { NextRequest, NextResponse } from "next/server";
import { z, ZodError, ZodSchema } from "zod";

// ===== VALIDATION MIDDLEWARE =====

export interface ValidationConfig {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
  headers?: ZodSchema;
}

export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: Array<{
    path: (string | number)[];
    message: string;
    code: string;
  }>;
}

/**
 * Validates request data against Zod schemas
 */
export class RequestValidator {
  static async validateRequest(
    request: NextRequest,
    config: ValidationConfig,
    params?: Record<string, string>
  ): Promise<{
    success: boolean;
    data?: {
      body?: any;
      query?: any;
      params?: any;
      headers?: any;
    };
    errors?: Array<{
      field: string;
      message: string;
      code: string;
    }>;
  }> {
    const results: Record<string, any> = {};
    const allErrors: Array<{ field: string; message: string; code: string }> = [];

    try {
      // Validate body
      if (config.body) {
        try {
          const bodyText = await request.text();
          const body = bodyText ? JSON.parse(bodyText) : {};
          results.body = config.body.parse(body);
        } catch (error) {
          if (error instanceof ZodError) {
            allErrors.push(...this.formatZodErrors(error, "body"));
          } else if (error instanceof SyntaxError) {
            allErrors.push({
              field: "body",
              message: "Invalid JSON format",
              code: "INVALID_JSON",
            });
          } else {
            allErrors.push({
              field: "body",
              message: "Failed to parse request body",
              code: "PARSE_ERROR",
            });
          }
        }
      }

      // Validate query parameters
      if (config.query) {
        try {
          const url = new URL(request.url);
          const queryParams = Object.fromEntries(url.searchParams.entries());
          results.query = config.query.parse(queryParams);
        } catch (error) {
          if (error instanceof ZodError) {
            allErrors.push(...this.formatZodErrors(error, "query"));
          }
        }
      }

      // Validate URL parameters
      if (config.params && params) {
        try {
          results.params = config.params.parse(params);
        } catch (error) {
          if (error instanceof ZodError) {
            allErrors.push(...this.formatZodErrors(error, "params"));
          }
        }
      }

      // Validate headers
      if (config.headers) {
        try {
          const headers = Object.fromEntries(request.headers.entries());
          results.headers = config.headers.parse(headers);
        } catch (error) {
          if (error instanceof ZodError) {
            allErrors.push(...this.formatZodErrors(error, "headers"));
          }
        }
      }

      if (allErrors.length > 0) {
        return {
          success: false,
          errors: allErrors,
        };
      }

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      console.error("Validation error:", error);
      return {
        success: false,
        errors: [
          {
            field: "general",
            message: "Internal validation error",
            code: "VALIDATION_ERROR",
          },
        ],
      };
    }
  }

  /**
   * Formats Zod validation errors for API responses
   */
  private static formatZodErrors(
    error: ZodError,
    prefix: string = ""
  ): Array<{ field: string; message: string; code: string }> {
    return error.errors.map((err) => ({
      field: prefix ? `${prefix}.${err.path.join(".")}` : err.path.join("."),
      message: err.message,
      code: err.code,
    }));
  }

  /**
   * Validates a single value against a schema
   */
  static validate<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T> {
    try {
      const result = schema.parse(data);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          success: false,
          errors: error.errors.map((err) => ({
            path: err.path,
            message: err.message,
            code: err.code,
          })),
        };
      }
      return {
        success: false,
        errors: [
          {
            path: [],
            message: "Unknown validation error",
            code: "UNKNOWN_ERROR",
          },
        ],
      };
    }
  }

  /**
   * Validates multiple values in parallel
   */
  static async validateBatch(
    validations: Array<{ schema: ZodSchema; data: unknown; name: string }>
  ): Promise<Record<string, ValidationResult>> {
    const results: Record<string, ValidationResult> = {};

    for (const { schema, data, name } of validations) {
      results[name] = this.validate(schema, data);
    }

    return results;
  }
}

/**
 * Higher-order function to create API route handlers with validation
 */
export function withValidation<T = any>(
  config: ValidationConfig,
  handler: (
    request: NextRequest,
    validatedData: {
      body?: any;
      query?: any;
      params?: any;
      headers?: any;
    },
    params?: Record<string, string>
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    context?: { params?: Record<string, string> }
  ): Promise<NextResponse> => {
    try {
      // Validate request
      const validation = await RequestValidator.validateRequest(
        request,
        config,
        context?.params
      );

      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Request validation failed",
              validationErrors: validation.errors,
            },
          },
          { status: 400 }
        );
      }

      // Call the actual handler with validated data
      return await handler(request, validation.data!, context?.params);
    } catch (error) {
      console.error("Handler error:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Internal server error",
          },
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware to validate organization access
 */
export function withOrganizationValidation(
  config: ValidationConfig & { organizationIdPath?: string }
) {
  const organizationIdPath = config.organizationIdPath || "organizationId";

  return function <T>(
    handler: (
      request: NextRequest,
      validatedData: {
        body?: any;
        query?: any;
        params?: any;
        headers?: any;
      },
      params?: Record<string, string>
    ) => Promise<NextResponse>
  ) {
    return withValidation(
      {
        ...config,
        // Ensure organizationId is always validated
        body: z.object({
          [organizationIdPath]: z.string().cuid("Invalid organization ID"),
        }),
      },
      async (request, validatedData, params) => {
        // Additional organization access validation could be added here
        return handler(request, validatedData, params);
      }
    );
  };
}

/**
 * Utility to create consistent error responses
 */
export class ValidationError extends Error {
  public code: string;
  public statusCode: number;
  public validationErrors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;

  constructor(
    message: string,
    code: string = "VALIDATION_ERROR",
    statusCode: number = 400,
    validationErrors?: Array<{ field: string; message: string; code: string }>
  ) {
    super(message);
    this.name = "ValidationError";
    this.code = code;
    this.statusCode = statusCode;
    this.validationErrors = validationErrors;
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.validationErrors && { validationErrors: this.validationErrors }),
      },
    };
  }
}

/**
 * Transform validation errors into user-friendly messages
 */
export const validationMessages = {
  required: "This field is required",
  email: "Please enter a valid email address",
  password: "Password must be at least 8 characters with uppercase, lowercase, and number",
  phone: "Please enter a valid phone number",
  url: "Please enter a valid URL",
  cuid: "Invalid ID format",
  uuid: "Invalid UUID format",
  positive: "Value must be positive",
  min: (min: number) => `Minimum value is ${min}`,
  max: (max: number) => `Maximum value is ${max}`,
  minLength: (min: number) => `Minimum length is ${min} characters`,
  maxLength: (max: number) => `Maximum length is ${max} characters`,
  regex: "Invalid format",
  custom: "Validation failed",
} as const;

/**
 * Sanitize input data
 */
export class DataSanitizer {
  /**
   * Remove HTML tags and potentially dangerous characters
   */
  static sanitizeHtml(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<[^>]*>/g, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "");
  }

  /**
   * Sanitize object recursively
   */
  static sanitizeObject(obj: any): any {
    if (typeof obj === "string") {
      return this.sanitizeHtml(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }
    
    if (obj && typeof obj === "object") {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  }

  /**
   * Remove null and undefined values
   */
  static removeNullish(obj: any): any {
    if (Array.isArray(obj)) {
      return obj
        .filter((item) => item != null)
        .map((item) => this.removeNullish(item));
    }
    
    if (obj && typeof obj === "object") {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value != null) {
          cleaned[key] = this.removeNullish(value);
        }
      }
      return cleaned;
    }
    
    return obj;
  }
}
