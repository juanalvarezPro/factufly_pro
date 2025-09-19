import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { organizationService } from "@/lib/services/organization.service";
import type { UserRole, OrganizationRole, PermissionAction, ResourceType } from "@/lib/validations/auth";

// ===== PERMISSION DEFINITIONS =====

export interface Permission {
  action: PermissionAction;
  resource: ResourceType;
  conditions?: Record<string, any>;
}

export interface RolePermissions {
  [key: string]: Permission[];
}

// Default role permissions
export const DEFAULT_ROLE_PERMISSIONS: Record<OrganizationRole, Permission[]> = {
  OWNER: [
    // Full access to everything
    { action: "CREATE", resource: "organization" },
    { action: "READ", resource: "organization" },
    { action: "UPDATE", resource: "organization" },
    { action: "DELETE", resource: "organization" },
    { action: "MANAGE_USERS", resource: "user" },
    { action: "MANAGE_ROLES", resource: "role" },
    { action: "MANAGE_BILLING", resource: "billing" },
    { action: "CONFIGURE_SETTINGS", resource: "settings" },
    { action: "VIEW_ANALYTICS", resource: "analytics" },
    { action: "EXPORT_DATA", resource: "analytics" },
    // Products
    { action: "CREATE", resource: "product" },
    { action: "READ", resource: "product" },
    { action: "UPDATE", resource: "product" },
    { action: "DELETE", resource: "product" },
    // Categories
    { action: "CREATE", resource: "category" },
    { action: "READ", resource: "category" },
    { action: "UPDATE", resource: "category" },
    { action: "DELETE", resource: "category" },
    // Combos
    { action: "CREATE", resource: "combo" },
    { action: "READ", resource: "combo" },
    { action: "UPDATE", resource: "combo" },
    { action: "DELETE", resource: "combo" },
    // Stock
    { action: "CREATE", resource: "stock" },
    { action: "READ", resource: "stock" },
    { action: "UPDATE", resource: "stock" },
    { action: "DELETE", resource: "stock" },
  ],
  
  ADMIN: [
    // Organization (limited)
    { action: "READ", resource: "organization" },
    { action: "UPDATE", resource: "organization" },
    { action: "MANAGE_USERS", resource: "user" },
    { action: "CONFIGURE_SETTINGS", resource: "settings" },
    { action: "VIEW_ANALYTICS", resource: "analytics" },
    // Products
    { action: "CREATE", resource: "product" },
    { action: "READ", resource: "product" },
    { action: "UPDATE", resource: "product" },
    { action: "DELETE", resource: "product" },
    // Categories
    { action: "CREATE", resource: "category" },
    { action: "READ", resource: "category" },
    { action: "UPDATE", resource: "category" },
    { action: "DELETE", resource: "category" },
    // Combos
    { action: "CREATE", resource: "combo" },
    { action: "READ", resource: "combo" },
    { action: "UPDATE", resource: "combo" },
    { action: "DELETE", resource: "combo" },
    // Stock
    { action: "CREATE", resource: "stock" },
    { action: "READ", resource: "stock" },
    { action: "UPDATE", resource: "stock" },
    { action: "DELETE", resource: "stock" },
  ],
  
  MANAGER: [
    // Organization (read only)
    { action: "READ", resource: "organization" },
    { action: "VIEW_ANALYTICS", resource: "analytics" },
    // Products
    { action: "CREATE", resource: "product" },
    { action: "READ", resource: "product" },
    { action: "UPDATE", resource: "product" },
    // Categories
    { action: "CREATE", resource: "category" },
    { action: "READ", resource: "category" },
    { action: "UPDATE", resource: "category" },
    // Combos
    { action: "CREATE", resource: "combo" },
    { action: "READ", resource: "combo" },
    { action: "UPDATE", resource: "combo" },
    // Stock
    { action: "CREATE", resource: "stock" },
    { action: "READ", resource: "stock" },
    { action: "UPDATE", resource: "stock" },
  ],
  
  USER: [
    // Organization (read only)
    { action: "READ", resource: "organization" },
    // Products (read only)
    { action: "READ", resource: "product" },
    // Categories (read only)
    { action: "READ", resource: "category" },
    // Combos (read only)
    { action: "READ", resource: "combo" },
    // Stock (read only)
    { action: "READ", resource: "stock" },
  ],
};

// ===== AUTHORIZATION SERVICE =====

export class AuthorizationService {
  /**
   * Check if user has permission for action on resource
   */
  static async hasPermission(
    userId: string,
    organizationId: string,
    action: PermissionAction,
    resource: ResourceType,
    resourceId?: string,
    conditions?: Record<string, any>
  ): Promise<boolean> {
      try {
        // Get user's organization membership
        const membership = await organizationService.getUserMembership(userId, organizationId);
        
        if (!membership) {
          return false;
        }
        
        // Get role permissions
        const rolePermissions = DEFAULT_ROLE_PERMISSIONS[membership.role] || [];
      
      // Check if user has the required permission
      const hasPermission = rolePermissions.some(permission => 
        permission.action === action && permission.resource === resource
      );
      
      if (!hasPermission) {
        return false;
      }
      
      // Apply additional conditions if specified
      if (conditions) {
        return this.checkConditions(membership, conditions, resourceId);
      }
      
      return true;
      
    } catch (error) {
      console.error("Permission check error:", error);
      return false;
    }
  }
  
  /**
   * Check multiple permissions at once
   */
  static async hasAnyPermission(
    userId: string,
    organizationId: string,
    permissions: Array<{ action: PermissionAction; resource: ResourceType }>
  ): Promise<boolean> {
    const results = await Promise.all(
      permissions.map(({ action, resource }) =>
        this.hasPermission(userId, organizationId, action, resource)
      )
    );
    
    return results.some(Boolean);
  }
  
  /**
   * Check all permissions
   */
  static async hasAllPermissions(
    userId: string,
    organizationId: string,
    permissions: Array<{ action: PermissionAction; resource: ResourceType }>
  ): Promise<boolean> {
    const results = await Promise.all(
      permissions.map(({ action, resource }) =>
        this.hasPermission(userId, organizationId, action, resource)
      )
    );
    
    return results.every(Boolean);
  }
  
  /**
   * Get all permissions for a user in an organization
   */
  static async getUserPermissions(
    userId: string,
    organizationId: string
  ): Promise<Permission[]> {
    try {
      const membership = await organizationService.getUserMembership(userId, organizationId);
      
      if (!membership) {
        return [];
      }
      
      return DEFAULT_ROLE_PERMISSIONS[membership.role] || [];
      
    } catch (error) {
      console.error("Get permissions error:", error);
      return [];
    }
  }
  
  /**
   * Check conditions for resource access
   */
  private static checkConditions(
    membership: any,
    conditions: Record<string, any>,
    resourceId?: string
  ): boolean {
    // Owner bypass all conditions
    if (membership.role === "OWNER") {
      return true;
    }
    
    // Check resource ownership
    if (conditions.requireOwnership && resourceId) {
      return membership.userId === resourceId;
    }
    
    // Check organization access
    if (conditions.requireSameOrganization && conditions.organizationId) {
      return membership.organizationId === conditions.organizationId;
    }
    
    // Add more condition checks as needed
    return true;
  }
}

// ===== DEV ROLE SPECIAL PERMISSIONS =====

/**
 * Check if user has DEV role (system-wide permissions)
 */
export async function hasDevRole(userId: string): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user || user.id !== userId) {
      return false;
    }
    return user.role === "DEV";
  } catch (error) {
    console.error("Error checking DEV role:", error);
    return false;
  }
}

/**
 * Check if user can access internal system data
 */
export async function canAccessInternalData(userId: string): Promise<boolean> {
  return await hasDevRole(userId);
}

/**
 * Check if user can impersonate other users
 */
export async function canImpersonate(userId: string, targetUserId?: string): Promise<boolean> {
  if (!(await hasDevRole(userId))) {
    return false;
  }
  
  // Prevent DEV from impersonating other DEV or ADMIN users
  if (targetUserId) {
    try {
      const targetUser = await getCurrentUser();
      if (targetUser && (targetUser.role === "DEV" || targetUser.role === "ADMIN")) {
        return false;
      }
    } catch (error) {
      console.error("Error checking target user role:", error);
      return false;
    }
  }
  
  return true;
}

/**
 * Check if user can access Stripe data
 */
export async function canAccessStripeData(userId: string): Promise<boolean> {
  return await hasDevRole(userId);
}

/**
 * Check if user can view system logs
 */
export async function canViewSystemLogs(userId: string): Promise<boolean> {
  return await hasDevRole(userId);
}

/**
 * Check if user can debug system
 */
export async function canDebugSystem(userId: string): Promise<boolean> {
  return await hasDevRole(userId);
}

// ===== AUTHORIZATION MIDDLEWARE =====

export interface AuthMiddlewareOptions {
  requiredPermission: {
    action: PermissionAction;
    resource: ResourceType;
  };
  organizationIdPath?: string; // Path in request to get organizationId
  resourceIdPath?: string;     // Path in request to get resourceId
  conditions?: Record<string, any>;
}

/**
 * Higher-order function to create authorization middleware
 */
export function withAuthorization(options: AuthMiddlewareOptions) {
  return function <T>(
    handler: (
      request: NextRequest,
      context?: { params?: Record<string, string> }
    ) => Promise<NextResponse>
  ) {
    return async (
      request: NextRequest,
      context?: { params?: Record<string, string> }
    ): Promise<NextResponse> => {
      try {
        // Get current user
        const user = await getCurrentUser();
        
        if (!user) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "UNAUTHORIZED",
                message: "Authentication required",
              },
            },
            { status: 401 }
          );
        }
        
        // Extract organization ID from request
        const organizationId = await extractFromRequest(
          request,
          context?.params,
          options.organizationIdPath || "organizationId"
        );
        
        if (!organizationId) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "BAD_REQUEST",
                message: "Organization ID is required",
              },
            },
            { status: 400 }
          );
        }
        
        // Extract resource ID if specified
        const resourceId = options.resourceIdPath
          ? await extractFromRequest(request, context?.params, options.resourceIdPath)
          : undefined;
        
        // Check permission
        const hasPermission = await AuthorizationService.hasPermission(
          user.id!,
          organizationId,
          options.requiredPermission.action,
          options.requiredPermission.resource,
          resourceId,
          options.conditions
        );
        
        if (!hasPermission) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "FORBIDDEN",
                message: "Insufficient permissions",
                details: {
                  required: options.requiredPermission,
                  resource: resourceId,
                },
              },
            },
            { status: 403 }
          );
        }
        
        // Call the original handler
        return await handler(request, context);
        
      } catch (error) {
        console.error("Authorization middleware error:", error);
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INTERNAL_ERROR",
              message: "Authorization check failed",
            },
          },
          { status: 500 }
        );
      }
    };
  };
}

/**
 * Extract value from request (body, query, or params)
 */
async function extractFromRequest(
  request: NextRequest,
  params: Record<string, string> | undefined,
  path: string
): Promise<string | undefined> {
  // Try params first
  if (params?.[path]) {
    return params[path];
  }
  
  // Try query parameters
  const url = new URL(request.url);
  const queryValue = url.searchParams.get(path);
  if (queryValue) {
    return queryValue;
  }
  
  // Try request body
  try {
    const body = await request.clone().json();
    if (body[path]) {
      return body[path];
    }
  } catch {
    // Ignore JSON parse errors
  }
  
  return undefined;
}

// ===== ROLE-BASED ACCESS CONTROL DECORATORS =====

/**
 * Require minimum role
 */
export function requireRole(minRole: OrganizationRole) {
  return withAuthorization({
    requiredPermission: {
      action: "READ",
      resource: "organization",
    },
    conditions: { minimumRole: minRole },
  });
}

/**
 * Require specific permissions
 */
export function requirePermissions(
  action: PermissionAction,
  resource: ResourceType,
  organizationIdPath?: string
) {
  return withAuthorization({
    requiredPermission: { action, resource },
    organizationIdPath,
  });
}

/**
 * Resource owner or admin access
 */
export function requireOwnershipOrAdmin(
  resource: ResourceType,
  resourceIdPath: string = "id",
  organizationIdPath: string = "organizationId"
) {
  return withAuthorization({
    requiredPermission: {
      action: "UPDATE",
      resource,
    },
    organizationIdPath,
    resourceIdPath,
    conditions: { requireOwnership: true },
  });
}

// ===== UTILITY FUNCTIONS =====

/**
 * Check if role has higher or equal privileges
 */
export function hasHigherOrEqualRole(userRole: OrganizationRole, requiredRole: OrganizationRole): boolean {
  const roleHierarchy: Record<OrganizationRole, number> = {
    USER: 1,
    MANAGER: 2,
    ADMIN: 3,
    OWNER: 4,
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: OrganizationRole): string {
  const roleNames: Record<OrganizationRole, string> = {
    OWNER: "Propietario",
    ADMIN: "Administrador", 
    MANAGER: "Gerente",
    USER: "Usuario",
  };
  
  return roleNames[role] || role;
}

/**
 * Get permission display name
 */
export function getPermissionDisplayName(action: PermissionAction, resource: ResourceType): string {
  const actionNames: Record<PermissionAction, string> = {
    CREATE: "Crear",
    READ: "Ver", 
    UPDATE: "Editar",
    DELETE: "Eliminar",
    RESTORE: "Restaurar",
    ARCHIVE: "Archivar",
    MANAGE_USERS: "Gestionar Usuarios",
    MANAGE_ROLES: "Gestionar Roles",
    MANAGE_BILLING: "Gestionar Facturación",
    EXPORT_DATA: "Exportar Datos",
    VIEW_ANALYTICS: "Ver Analíticas",
    CONFIGURE_SETTINGS: "Configurar Ajustes",
    IMPERSONATE: "Suplantar Usuario",
    VIEW_INTERNAL_DATA: "Ver Datos Internos",
    MANAGE_STRIPE: "Gestionar Stripe",
    VIEW_LOGS: "Ver Registros",
    DEBUG_SYSTEM: "Depurar Sistema",
  };
  
  const resourceNames: Record<ResourceType, string> = {
    organization: "Organización",
    product: "Productos",
    combo: "Combos",
    category: "Categorías",
    packaging: "Empaquetado",
    stock: "Inventario",
    user: "Usuarios",
    role: "Roles",
    billing: "Facturación",
    settings: "Configuración",
    analytics: "Analíticas",
    internal_data: "Datos Internos",
    stripe_data: "Datos de Stripe",
    system_logs: "Registros del Sistema",
    audit_logs: "Registros de Auditoría",
  };
  
  return `${actionNames[action]} ${resourceNames[resource]}`;
}
