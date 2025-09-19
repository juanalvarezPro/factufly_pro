"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import type { OrganizationRole, PermissionAction, ResourceType } from "@/lib/validations/auth";

// ===== TYPES =====

export interface Permission {
  action: PermissionAction;
  resource: ResourceType;
  conditions?: Record<string, any>;
}

export interface UserPermissions {
  role: OrganizationRole;
  permissions: Permission[];
  organizationId: string;
  canAccess: (action: PermissionAction, resource: ResourceType) => boolean;
  hasRole: (minRole: OrganizationRole) => boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isManager: boolean;
}

// ===== PERMISSION HOOKS =====

/**
 * Get user permissions for current organization
 */
export function usePermissions(organizationId: string): {
  permissions: UserPermissions | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const { data: session } = useSession();
  
  const {
    data: permissions,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["permissions", organizationId, session?.user?.id],
    queryFn: async (): Promise<UserPermissions> => {
      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }
      
      const response = await fetch(`/api/organizations/${organizationId}/permissions`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch permissions");
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || "Failed to fetch permissions");
      }
      
      const { role, permissions: userPermissions } = result.data;
      
      return {
        role,
        permissions: userPermissions,
        organizationId,
        canAccess: (action: PermissionAction, resource: ResourceType) => {
          return userPermissions.some((p: Permission) => 
            p.action === action && p.resource === resource
          );
        },
        hasRole: (minRole: OrganizationRole) => {
          return hasHigherOrEqualRole(role, minRole);
        },
        isOwner: role === "OWNER",
        isAdmin: role === "ADMIN" || role === "OWNER",
        isManager: role === "MANAGER" || role === "ADMIN" || role === "OWNER",
      };
    },
    enabled: !!session?.user?.id && !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
  
  return {
    permissions,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

/**
 * Check if user can access specific action/resource
 */
export function useCanAccess(
  organizationId: string,
  action: PermissionAction,
  resource: ResourceType
): {
  canAccess: boolean;
  isLoading: boolean;
  error: Error | null;
} {
  const { permissions, isLoading, error } = usePermissions(organizationId);
  
  return {
    canAccess: permissions?.canAccess(action, resource) ?? false,
    isLoading,
    error,
  };
}

/**
 * Check if user has minimum role
 */
export function useHasRole(
  organizationId: string,
  minRole: OrganizationRole
): {
  hasRole: boolean;
  isLoading: boolean;
  error: Error | null;
} {
  const { permissions, isLoading, error } = usePermissions(organizationId);
  
  return {
    hasRole: permissions?.hasRole(minRole) ?? false,
    isLoading,
    error,
  };
}

/**
 * Get user's current role
 */
export function useUserRole(organizationId: string): {
  role: OrganizationRole | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  const { permissions, isLoading, error } = usePermissions(organizationId);
  
  return {
    role: permissions?.role,
    isLoading,
    error,
  };
}

// ===== UTILITY FUNCTIONS =====

/**
 * Check if role has higher or equal privileges
 */
function hasHigherOrEqualRole(userRole: OrganizationRole, requiredRole: OrganizationRole): boolean {
  const roleHierarchy: Record<OrganizationRole, number> = {
    USER: 1,
    MANAGER: 2,
    ADMIN: 3,
    OWNER: 4,
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

// ===== PERMISSION COMPONENTS =====

/**
 * Conditional render based on permissions
 */
export function PermissionGate({
  organizationId,
  action,
  resource,
  minRole,
  fallback = null,
  children,
}: {
  organizationId: string;
  action?: PermissionAction;
  resource?: ResourceType;
  minRole?: OrganizationRole;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}): JSX.Element {
  const { permissions, isLoading } = usePermissions(organizationId);
  
  if (isLoading) {
    return <>{fallback}</>;
  }
  
  if (!permissions) {
    return <>{fallback}</>;
  }
  
  // Check specific permission
  if (action && resource) {
    if (!permissions.canAccess(action, resource)) {
      return <>{fallback}</>;
    }
  }
  
  // Check minimum role
  if (minRole) {
    if (!permissions.hasRole(minRole)) {
      return <>{fallback}</>;
    }
  }
  
  return <>{children}</>;
}

/**
 * Role-based conditional render
 */
export function RoleGate({
  organizationId,
  roles,
  fallback = null,
  children,
}: {
  organizationId: string;
  roles: OrganizationRole[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}): JSX.Element {
  const { permissions, isLoading } = usePermissions(organizationId);
  
  if (isLoading) {
    return <>{fallback}</>;
  }
  
  if (!permissions || !roles.includes(permissions.role)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// ===== PERMISSION UTILITIES FOR COMPONENTS =====

/**
 * Higher-order component for permission checking
 */
export function withPermissions<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission: {
    action: PermissionAction;
    resource: ResourceType;
  },
  fallback: React.ComponentType<P> | null = null
) {
  return function PermissionWrappedComponent(
    props: P & { organizationId: string }
  ) {
    const { canAccess, isLoading } = useCanAccess(
      props.organizationId,
      requiredPermission.action,
      requiredPermission.resource
    );
    
    if (isLoading) {
      return null;
    }
    
    if (!canAccess) {
      return fallback ? React.createElement(fallback, props) : null;
    }
    
    return <Component {...props} />;
  };
}

/**
 * Hook for checking multiple permissions
 */
export function useMultiplePermissions(
  organizationId: string,
  permissions: Array<{ action: PermissionAction; resource: ResourceType }>
): {
  results: Record<string, boolean>;
  canAccessAny: boolean;
  canAccessAll: boolean;
  isLoading: boolean;
  error: Error | null;
} {
  const { permissions: userPermissions, isLoading, error } = usePermissions(organizationId);
  
  const results: Record<string, boolean> = {};
  
  permissions.forEach(({ action, resource }) => {
    const key = `${action}:${resource}`;
    results[key] = userPermissions?.canAccess(action, resource) ?? false;
  });
  
  const canAccessAny = Object.values(results).some(Boolean);
  const canAccessAll = Object.values(results).every(Boolean);
  
  return {
    results,
    canAccessAny,
    canAccessAll,
    isLoading,
    error,
  };
}
