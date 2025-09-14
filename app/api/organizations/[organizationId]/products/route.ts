import { NextResponse } from "next/server";
import { productService } from "@/lib/services/product.service";
import { createProductSchema, productListQuerySchema } from "@/lib/validations/product";
import { getCurrentUser } from "@/lib/session";
import { withAuthorization } from "@/lib/middleware/auth";

interface RouteParams {
  params: { organizationId: string };
}

export const GET = withAuthorization({
  requiredPermission: { action: "READ", resource: "product" },
  organizationIdPath: "organizationId"
})(async function GET(request: Request, { params }: RouteParams) {
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
    
    const query = productListQuerySchema.parse({
      organizationId: params.organizationId,
      ...searchParams,
    });

    const result = await productService.listProducts(query);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error(`GET /api/organizations/${params.organizationId}/products error:`, error);

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
});

export const POST = withAuthorization({
  requiredPermission: { action: "CREATE", resource: "product" },
  organizationIdPath: "organizationId"
})(async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createProductSchema.parse({
      ...body,
      organizationId: params.organizationId,
    });

    const product = await productService.createProduct(validatedData);

    return NextResponse.json(
      {
        success: true,
        data: product,
        message: "Product created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(`POST /api/organizations/${params.organizationId}/products error:`, error);

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
});
