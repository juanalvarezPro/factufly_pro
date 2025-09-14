import { NextResponse } from "next/server";
import { productService } from "@/lib/services/product.service";
import { updateProductSchema } from "@/lib/validations/product";
import { getCurrentUser } from "@/lib/session";

interface RouteParams {
  params: { 
    organizationId: string;
    productId: string;
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

    const product = await productService.getProductById(params.productId, params.organizationId);

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    console.error(`GET /api/organizations/${params.organizationId}/products/${params.productId} error:`, error);
    
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
    const validatedData = updateProductSchema.parse(body);

    const product = await productService.updateProduct(
      params.productId,
      params.organizationId,
      validatedData
    );

    return NextResponse.json({
      success: true,
      data: product,
      message: "Product updated successfully",
    });
  } catch (error: any) {
    console.error(`PATCH /api/organizations/${params.organizationId}/products/${params.productId} error:`, error);

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

    const product = await productService.deleteProduct(params.productId, params.organizationId);

    return NextResponse.json({
      success: true,
      data: product,
      message: "Product deleted successfully",
    });
  } catch (error: any) {
    console.error(`DELETE /api/organizations/${params.organizationId}/products/${params.productId} error:`, error);

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
