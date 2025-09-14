import { NextResponse } from "next/server";
import { comboService } from "@/lib/services/combo.service";
import { updateProductComboSchema } from "@/lib/validations/combo";
import { getCurrentUser } from "@/lib/session";

interface RouteParams {
  params: { 
    organizationId: string;
    comboId: string;
  };
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

    const combo = await comboService.getComboById(params.comboId, params.organizationId);

    return NextResponse.json({
      success: true,
      data: combo,
    });
  } catch (error: any) {
    console.error(`GET /api/organizations/${params.organizationId}/combos/${params.comboId} error:`, error);
    
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
    const validatedData = updateProductComboSchema.parse(body);

    const combo = await comboService.updateCombo(
      params.comboId,
      params.organizationId,
      validatedData
    );

    return NextResponse.json({
      success: true,
      data: combo,
      message: "Combo updated successfully",
    });
  } catch (error: any) {
    console.error(`PATCH /api/organizations/${params.organizationId}/combos/${params.comboId} error:`, error);

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

    const combo = await comboService.deleteCombo(params.comboId, params.organizationId);

    return NextResponse.json({
      success: true,
      data: combo,
      message: "Combo deleted successfully",
    });
  } catch (error: any) {
    console.error(`DELETE /api/organizations/${params.organizationId}/combos/${params.comboId} error:`, error);

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
