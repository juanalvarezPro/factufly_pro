import { NextResponse } from "next/server";
import { organizationService } from "@/lib/services/organization.service";
import { createOrganizationSchema } from "@/lib/validations/organization";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const organizations = await organizationService.getUserOrganizations();

    return NextResponse.json({
      success: true,
      data: organizations,
    });
  } catch (error: any) {
    console.error("GET /api/organizations error:", error);
    
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

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createOrganizationSchema.parse(body);

    const organization = await organizationService.create(validatedData);

    return NextResponse.json(
      {
        success: true,
        data: organization,
        message: "Organization created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/organizations error:", error);

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
