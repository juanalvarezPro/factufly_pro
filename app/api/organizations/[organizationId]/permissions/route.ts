import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { AuthorizationService, DEFAULT_ROLE_PERMISSIONS } from "@/lib/middleware/auth";
import { organizationService } from "@/lib/services/organization.service";

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const organizationId = params.organizationId;

    // Get user's organization membership
    const membership = await organizationService.getMembership(user.id!, organizationId);
    
    if (!membership) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
        { status: 403 }
      );
    }

    // Get role permissions
    const permissions = DEFAULT_ROLE_PERMISSIONS[membership.role] || [];

    return NextResponse.json({
      success: true,
      data: {
        role: membership.role,
        permissions,
        membership: {
          id: membership.id,
          status: membership.status,
          joinedAt: membership.joinedAt,
        },
      },
    });

  } catch (error: any) {
    console.error("Get permissions error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get permissions",
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const organizationId = params.organizationId;
    const body = await request.json();
    const { action, resource, resourceId, conditions } = body;

    // Check if user has the requested permission
    const hasPermission = await AuthorizationService.hasPermission(
      user.id!,
      organizationId,
      action,
      resource,
      resourceId,
      conditions
    );

    return NextResponse.json({
      success: true,
      data: {
        hasPermission,
        action,
        resource,
        resourceId,
      },
    });

  } catch (error: any) {
    console.error("Check permission error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to check permission",
        },
      },
      { status: 500 }
    );
  }
}
