import { NextResponse } from "next/server";
import { organizationService } from "@/lib/services/organization.service";
import { updateOrganizationSchema } from "@/lib/validations/organization";
import { getCurrentUser } from "@/lib/session";

interface RouteParams {
  params: { organizationId: string };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const organization = await organizationService.getById(params.organizationId);

    return NextResponse.json({
      success: true,
      data: organization,
    });
  } catch (error: any) {
    console.error(`GET /api/organizations/${params.organizationId} error:`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || "INTERNAL_ERROR",
          message: error.message || "Internal server error",
        },
      },
      { status: error.statusCode || 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateOrganizationSchema.parse(body);

    const organization = await organizationService.update(params.organizationId, validatedData);

    return NextResponse.json({
      success: true,
      data: organization,
      message: "Organization updated successfully",
    });
  } catch (error: any) {
    console.error(`PATCH /api/organizations/${params.organizationId} error:`, error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input data",
            validationErrors: error.errors,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || "INTERNAL_ERROR",
          message: error.message || "Internal server error",
        },
      },
      { status: error.statusCode || 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    await organizationService.delete(params.organizationId);

    return NextResponse.json({
      success: true,
      message: "Organization deleted successfully",
    });
  } catch (error: any) {
    console.error(`DELETE /api/organizations/${params.organizationId} error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || "INTERNAL_ERROR",
          message: error.message || "Internal server error",
        },
      },
      { status: error.statusCode || 500 }
    );
  }
}
