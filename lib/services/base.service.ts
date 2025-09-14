import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import type { PaginatedResult, PaginationMeta } from "@/types/database";
import { RequestValidator } from "@/lib/middleware/validation";
import {
  StrictValidationError,
  StrictPermissionError,
  StrictBusinessRuleError,
  type StrictServiceOptions,
  type StrictValidationResult,
  type StrictCreateOptions,
  type StrictUpdateOptions,
  type StrictQueryOptions,
} from "@/lib/types/strict";
import type { ZodSchema } from "zod";

export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string = "SERVICE_ERROR",
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export class ValidationError extends ServiceError {
  constructor(message: string, public field?: string) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends ServiceError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends ServiceError {
  constructor(message: string = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends ServiceError {
  constructor(message: string = "Forbidden") {
    super(message, "FORBIDDEN", 403);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends ServiceError {
  constructor(message: string = "Resource already exists") {
    super(message, "CONFLICT", 409);
    this.name = "ConflictError";
  }
}

export abstract class BaseService {
  protected prisma = prisma;

  /**
   * Get current authenticated user
   */
  protected async getCurrentUser() {
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError("Authentication required");
    }
    return user;
  }

  /**
   * Verify user has access to organization
   */
  protected async verifyOrganizationAccess(organizationId: string, userId?: string) {
    const currentUserId = userId || (await this.getCurrentUser()).id;
    
    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: currentUserId,
        status: "approved",
      },
      include: {
        organization: true,
      },
    });

    if (!membership) {
      throw new ForbiddenError("Access to organization denied");
    }

    return membership;
  }

  /**
   * Create paginated result
   */
  protected createPaginatedResult<T>(
    items: T[],
    total: number,
    page: number,
    limit: number
  ): PaginatedResult<T> {
    const totalPages = Math.ceil(total / limit);
    
    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Build pagination skip/take from page/limit
   */
  protected buildPagination(page: number, limit: number) {
    return {
      skip: (page - 1) * limit,
      take: limit,
    };
  }

  /**
   * Build orderBy clause from sort parameters
   */
  protected buildOrderBy(sortBy: string, sortOrder: "asc" | "desc" = "desc") {
    return { [sortBy]: sortOrder };
  }

  /**
   * Handle Prisma errors and convert to service errors
   */
  protected handlePrismaError(error: any, context?: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case "P2002":
          throw new ConflictError(
            `${context || "Resource"} already exists (unique constraint failed)`
          );
        case "P2025":
          throw new NotFoundError(context || "Resource");
        case "P2003":
          throw new ValidationError("Invalid reference to related resource");
        case "P2004":
          throw new ValidationError("Constraint failed on database");
        default:
          console.error("Unhandled Prisma error:", error);
          throw new ServiceError(`Database error: ${error.message}`);
      }
    }

    if (error instanceof ServiceError) {
      throw error;
    }

    console.error("Unhandled service error:", error);
    throw new ServiceError("Internal server error");
  }

  /**
   * Execute transaction with error handling
   */
  protected async withTransaction<T>(
    operations: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(operations);
    } catch (error) {
      this.handlePrismaError(error, "Transaction");
    }
  }

  /**
   * Soft delete helper
   */
  protected async softDelete(model: any, id: string, organizationId: string) {
    return await model.update({
      where: { id, organizationId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Restore soft deleted helper
   */
  protected async restore(model: any, id: string, organizationId: string) {
    return await model.update({
      where: { id, organizationId },
      data: { deletedAt: null },
    });
  }

  /**
   * Validate data using Zod schema with strict typing
   */
  protected validateStrict<T>(schema: ZodSchema<T>, data: unknown): T {
    const result = RequestValidator.validate(schema, data);
    
    if (!result.success) {
      const formattedErrors = result.errors?.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      })) || [];
      
      throw new StrictValidationError(
        "Data validation failed",
        formattedErrors
      );
    }
    
    return result.data!;
  }

  /**
   * Validate multiple schemas in batch
   */
  protected async validateBatch(
    validations: Array<{ schema: ZodSchema; data: unknown; name: string }>
  ): Promise<Record<string, any>> {
    const results = await RequestValidator.validateBatch(validations);
    const errors: Array<{ field: string; message: string; code: string }> = [];
    const validatedData: Record<string, any> = {};

    for (const [name, result] of Object.entries(results)) {
      if (!result.success) {
        const fieldErrors = result.errors?.map(err => ({
          field: `${name}.${err.path.join('.')}`,
          message: err.message,
          code: err.code,
        })) || [];
        errors.push(...fieldErrors);
      } else {
        validatedData[name] = result.data;
      }
    }

    if (errors.length > 0) {
      throw new StrictValidationError("Batch validation failed", errors);
    }

    return validatedData;
  }

  /**
   * Validate service options
   */
  protected validateServiceOptions(options: StrictServiceOptions): void {
    if (!options.userId || typeof options.userId !== 'string') {
      throw new StrictValidationError("Invalid user ID", [
        { field: "userId", message: "User ID is required", code: "REQUIRED" }
      ]);
    }

    if (!options.organizationId || typeof options.organizationId !== 'string') {
      throw new StrictValidationError("Invalid organization ID", [
        { field: "organizationId", message: "Organization ID is required", code: "REQUIRED" }
      ]);
    }
  }

  /**
   * Check business rules
   */
  protected validateBusinessRule(
    condition: boolean,
    message: string,
    ruleCode: string
  ): void {
    if (!condition) {
      throw new StrictBusinessRuleError(message, ruleCode);
    }
  }
}
