"use client";

import React from "react";
import { usePermissions, PermissionGate as BasePermissionGate, RoleGate } from "@/hooks/use-permissions";
import type { OrganizationRole, PermissionAction, ResourceType } from "@/lib/validations/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldX } from "lucide-react";

// ===== PERMISSION GATE COMPONENTS =====

interface PermissionGateProps {
  organizationId: string;
  action?: PermissionAction;
  resource?: ResourceType;
  minRole?: OrganizationRole;
  fallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
  children: React.ReactNode;
  showAccessDenied?: boolean;
}

/**
 * Enhanced Permission Gate with loading and error states
 */
export function PermissionGate({
  organizationId,
  action,
  resource,
  minRole,
  fallback = null,
  loadingFallback,
  children,
  showAccessDenied = false,
}: PermissionGateProps) {
  const { permissions, isLoading, error } = usePermissions(organizationId);

  // Loading state
  if (isLoading) {
    return <>{loadingFallback || <PermissionSkeleton />}</>;
  }

  // Error state
  if (error) {
    console.error("Permission error:", error);
    return <>{fallback}</>;
  }

  // No permissions (user not member)
  if (!permissions) {
    return showAccessDenied ? <AccessDeniedAlert /> : <>{fallback}</>;
  }

  // Check specific permission
  if (action && resource) {
    if (!permissions.canAccess(action, resource)) {
      return showAccessDenied ? <AccessDeniedAlert /> : <>{fallback}</>;
    }
  }

  // Check minimum role
  if (minRole) {
    if (!permissions.hasRole(minRole)) {
      return showAccessDenied ? <AccessDeniedAlert /> : <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

/**
 * Role-based gate for specific roles
 */
interface RoleGateProps {
  organizationId: string;
  roles: OrganizationRole[];
  fallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
  children: React.ReactNode;
  showAccessDenied?: boolean;
}

export function RoleBasedGate({
  organizationId,
  roles,
  fallback = null,
  loadingFallback,
  children,
  showAccessDenied = false,
}: RoleGateProps) {
  const { permissions, isLoading, error } = usePermissions(organizationId);

  if (isLoading) {
    return <>{loadingFallback || <PermissionSkeleton />}</>;
  }

  if (error || !permissions) {
    return showAccessDenied ? <AccessDeniedAlert /> : <>{fallback}</>;
  }

  if (!roles.includes(permissions.role)) {
    return showAccessDenied ? <AccessDeniedAlert /> : <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Admin-only gate (ADMIN or OWNER)
 */
export function AdminGate({
  organizationId,
  fallback,
  loadingFallback,
  children,
  showAccessDenied = false,
}: Omit<RoleGateProps, "roles">) {
  return (
    <RoleBasedGate
      organizationId={organizationId}
      roles={["ADMIN", "OWNER"]}
      fallback={fallback}
      loadingFallback={loadingFallback}
      showAccessDenied={showAccessDenied}
    >
      {children}
    </RoleBasedGate>
  );
}

/**
 * Owner-only gate
 */
export function OwnerGate({
  organizationId,
  fallback,
  loadingFallback,
  children,
  showAccessDenied = false,
}: Omit<RoleGateProps, "roles">) {
  return (
    <RoleBasedGate
      organizationId={organizationId}
      roles={["OWNER"]}
      fallback={fallback}
      loadingFallback={loadingFallback}
      showAccessDenied={showAccessDenied}
    >
      {children}
    </RoleBasedGate>
  );
}

/**
 * Manager+ gate (MANAGER, ADMIN, or OWNER)
 */
export function ManagerGate({
  organizationId,
  fallback,
  loadingFallback,
  children,
  showAccessDenied = false,
}: Omit<RoleGateProps, "roles">) {
  return (
    <RoleBasedGate
      organizationId={organizationId}
      roles={["MANAGER", "ADMIN", "OWNER"]}
      fallback={fallback}
      loadingFallback={loadingFallback}
      showAccessDenied={showAccessDenied}
    >
      {children}
    </RoleBasedGate>
  );
}

// ===== UI COMPONENTS =====

/**
 * Loading skeleton for permission checks
 */
function PermissionSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

/**
 * Access denied alert
 */
function AccessDeniedAlert() {
  return (
    <Alert variant="destructive" className="border-red-200">
      <ShieldX className="size-4" />
      <AlertDescription>
        No tienes permisos suficientes para acceder a esta funcionalidad.
      </AlertDescription>
    </Alert>
  );
}

// ===== CONDITIONAL RENDERING UTILITIES =====

/**
 * Conditional button rendering based on permissions
 */
interface PermissionButtonProps {
  organizationId: string;
  action: PermissionAction;
  resource: ResourceType;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export function PermissionButton({
  organizationId,
  action,
  resource,
  children,
  fallback = null,
  ...props
}: PermissionButtonProps) {
  return (
    <PermissionGate
      organizationId={organizationId}
      action={action}
      resource={resource}
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  );
}

/**
 * Menu item with permission check
 */
interface PermissionMenuItemProps {
  organizationId: string;
  action: PermissionAction;
  resource: ResourceType;
  children: React.ReactNode;
}

export function PermissionMenuItem({
  organizationId,
  action,
  resource,
  children,
}: PermissionMenuItemProps) {
  return (
    <PermissionGate
      organizationId={organizationId}
      action={action}
      resource={resource}
    >
      {children}
    </PermissionGate>
  );
}

// ===== HIGHER-ORDER COMPONENTS =====

/**
 * HOC for protecting entire page components
 */
export function withPagePermissions<P extends { organizationId: string }>(
  Component: React.ComponentType<P>,
  requiredPermission: {
    action: PermissionAction;
    resource: ResourceType;
  }
) {
  return function ProtectedPage(props: P) {
    return (
      <PermissionGate
        organizationId={props.organizationId}
        action={requiredPermission.action}
        resource={requiredPermission.resource}
        showAccessDenied={true}
        loadingFallback={<PageLoadingSkeleton />}
      >
        <Component {...props} />
      </PermissionGate>
    );
  };
}

/**
 * Page loading skeleton
 */
function PageLoadingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    </div>
  );
}

// ===== ROLE DISPLAY COMPONENTS =====

/**
 * Display user's current role
 */
interface RoleDisplayProps {
  organizationId: string;
  className?: string;
}

export function RoleDisplay({ organizationId, className }: RoleDisplayProps) {
  const { permissions, isLoading } = usePermissions(organizationId);

  if (isLoading) {
    return <Skeleton className={`h-4 w-20 ${className}`} />;
  }

  if (!permissions) {
    return null;
  }

  const roleNames: Record<OrganizationRole, string> = {
    OWNER: "Propietario",
    ADMIN: "Administrador",
    MANAGER: "Gerente", 
    USER: "Usuario",
  };

  return (
    <span className={className}>
      {roleNames[permissions.role]}
    </span>
  );
}

/**
 * Permission indicator badge
 */
interface PermissionBadgeProps {
  organizationId: string;
  action: PermissionAction;
  resource: ResourceType;
  children?: React.ReactNode;
}

export function PermissionBadge({
  organizationId,
  action,
  resource,
  children,
}: PermissionBadgeProps) {
  const { permissions, isLoading } = usePermissions(organizationId);

  if (isLoading) {
    return <Skeleton className="h-4 w-16" />;
  }

  const hasPermission = permissions?.canAccess(action, resource) ?? false;

  return (
    <span
      className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${
        hasPermission
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800"
      }`}
    >
      {children || (hasPermission ? "Permitido" : "Denegado")}
    </span>
  );
}
