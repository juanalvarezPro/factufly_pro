import { NextResponse } from "next/server";
import { comboService } from "@/lib/services/combo.service";
import { createProductComboSchema, comboWithProductsSchema, comboListQuerySchema } from "@/lib/validations/combo";
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

    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams);
    
    const query = comboListQuerySchema.parse({
      organizationId: params.organizationId,
      ...searchParams,
    });

    const result = await comboService.listCombos(query);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error(`GET /api/organizations/${params.organizationId}/combos error:`, error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
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

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Determine if this is a simple combo or combo with products
    const hasProducts = body.products && Array.isArray(body.products);
    
    if (hasProducts) {
      const validatedData = comboWithProductsSchema.parse({
        ...body,
        organizationId: params.organizationId,
      });
      
      const combo = await comboService.createComboWithProducts(validatedData);
      
      return NextResponse.json(
        {
          success: true,
          data: combo,
          message: "Combo with products created successfully",
        },
        { status: 201 }
      );
    } else {
      const validatedData = createProductComboSchema.parse({
        ...body,
        organizationId: params.organizationId,
      });

      const combo = await comboService.createCombo(validatedData);

      return NextResponse.json(
        {
          success: true,
          data: combo,
          message: "Combo created successfully",
        },
        { status: 201 }
      );
    }
  } catch (error: any) {
    console.error(`POST /api/organizations/${params.organizationId}/combos error:`, error);

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
