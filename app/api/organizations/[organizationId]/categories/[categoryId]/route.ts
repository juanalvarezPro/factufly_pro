import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuthorization } from "@/lib/middleware/auth";

interface RouteParams {
  params: { organizationId: string; categoryId: string };
}

export const GET = withAuthorization({
  requiredPermission: { action: "READ", resource: "category" },
  organizationIdPath: "organizationId",
})(async function (
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { organizationId, categoryId } = params;

    // Get the category with related data
    const category = await prisma.productCategory.findFirst({
      where: {
        id: categoryId,
        organizationId,
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    // Transform to match expected type
    const categoryWithCount = {
      ...category,
      productCount: category._count.products,
    };

    return NextResponse.json(categoryWithCount);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
});

export const PATCH = withAuthorization({
  requiredPermission: { action: "UPDATE", resource: "category" },
  organizationIdPath: "organizationId",
})(async function (
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { organizationId, categoryId } = params;
    const body = await request.json();

    // Validate that the category exists and belongs to the organization
    const existingCategory = await prisma.productCategory.findFirst({
      where: {
        id: categoryId,
        organizationId,
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    // Update the category
    const updatedCategory = await prisma.productCategory.update({
      where: { id: categoryId },
      data: {
        name: body.name,
        description: body.description,
        imagenAlt: body.imagenAlt,
        summaryCardId: body.summaryCardId,
        active: body.active,
        isCombo: body.isCombo,
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    // Transform to match expected type
    const categoryWithCount = {
      ...updatedCategory,
      productCount: updatedCategory._count.products,
    };

    return NextResponse.json(categoryWithCount);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
});

export const DELETE = withAuthorization({
  requiredPermission: { action: "DELETE", resource: "category" },
  organizationIdPath: "organizationId",
})(async function (
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { organizationId, categoryId } = params;

    // Validate that the category exists and belongs to the organization
    const existingCategory = await prisma.productCategory.findFirst({
      where: {
        id: categoryId,
        organizationId,
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    // Check if category has products
    const productCount = await prisma.product.count({
      where: { categoryId },
    });

    if (productCount > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar una categoría que tiene productos asociados" },
        { status: 400 }
      );
    }

    // Delete the category
    await prisma.productCategory.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ message: "Categoría eliminada exitosamente" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
});
