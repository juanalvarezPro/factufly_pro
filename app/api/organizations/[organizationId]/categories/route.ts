import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuthorization } from "@/lib/middleware/auth";
import { v4 as uuid } from "uuid";

export const GET = withAuthorization({
  requiredPermission: { action: "READ", resource: "category" },
  organizationIdPath: "organizationId",
})(async function (
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    const organizationId = params.organizationId;

    // Build where clause
    const where: any = {
      organizationId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(status !== "all" && { status }),
    };

    // Get total count
    const total = await prisma.productCategory.count({ where });

    // Build orderBy
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get categories with pagination
    const categories = await prisma.productCategory.findMany({
      where,
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    // Transform to match expected type
    const categoriesWithCounts = categories.map((category) => ({
      ...category,
      productCount: category._count.products,
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: categoriesWithCounts,
      total,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
});

export const POST = withAuthorization({
  requiredPermission: { action: "CREATE", resource: "category" },
  organizationIdPath: "organizationId",
})(async function (
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const organizationId = params.organizationId;
    const body = await request.json();

    const {
      name,
      description,
      parentId,
      status = "active",
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    // Check if category name already exists in organization
    const existingCategory = await prisma.productCategory.findFirst({
      where: {
        organizationId,
        name,
        ...(parentId && { parentId }),
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Ya existe una categoría con este nombre" },
        { status: 400 }
      );
    }

    // Validate parent exists if provided
    if (parentId) {
      const parentCategory = await prisma.productCategory.findFirst({
        where: {
          id: parentId,
          organizationId,
        },
      });

      if (!parentCategory) {
        return NextResponse.json(
          { error: "La categoría padre no existe" },
          { status: 400 }
        );
      }
    }

    // Create category
    const category = await prisma.productCategory.create({
      data: {
        organizationId,
        name,
        description,
        ...(parentId ? { parentId } : {}),
        active: status === "active",
        isCombo: false,
        uuid: uuid(), // @ts-ignore
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
    const categoryWithCounts = {
      ...category,
      productCount: category._count.products,
    };

    return NextResponse.json(categoryWithCounts, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
});
