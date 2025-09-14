import "server-only";

import { BaseService, NotFoundError } from "./base.service";
import type {
  CreateProductInput,
  UpdateProductInput,
  CreateProductCategoryInput,
  UpdateProductCategoryInput,
  CreateProductCardInput,
  UpdateProductCardInput,
  CreateMeasureInput,
  UpdateMeasureInput,
  CreateProductStockInput,
  UpdateProductStockInput,
  BulkUpdateStockInput,
  ProductListQueryInput,
  ProductSearchInput,
} from "@/lib/validations/product";
import type {
  ProductWithRelations,
  ProductCategoryWithRelations,
  ProductStockWithMeasure,
  PaginatedResult,
  ProductFilters,
} from "@/types/database";

export class ProductService extends BaseService {
  // ===== PRODUCT CATEGORIES =====

  /**
   * Create product category
   */
  async createCategory(data: CreateProductCategoryInput): Promise<ProductCategoryWithRelations> {
    await this.verifyOrganizationAccess(data.organizationId);

    try {
      return await this.prisma.productCategory.create({
        data,
        include: {
          organization: true,
          summaryCard: true,
          _count: {
            select: { products: true },
          },
        },
      });
    } catch (error) {
      this.handlePrismaError(error, "Product category");
    }
  }

  /**
   * Get categories for organization
   */
  async getCategories(
    organizationId: string,
    includeInactive = false
  ): Promise<ProductCategoryWithRelations[]> {
    await this.verifyOrganizationAccess(organizationId);

    return await this.prisma.productCategory.findMany({
      where: {
        organizationId,
        ...(includeInactive ? {} : { active: true }),
      },
      include: {
        organization: true,
        summaryCard: true,
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Update product category
   */
  async updateCategory(
    categoryId: string,
    organizationId: string,
    data: UpdateProductCategoryInput
  ): Promise<ProductCategoryWithRelations> {
    await this.verifyOrganizationAccess(organizationId);

    try {
      return await this.prisma.productCategory.update({
        where: { id: categoryId, organizationId },
        data,
        include: {
          organization: true,
          summaryCard: true,
          _count: {
            select: { products: true },
          },
        },
      });
    } catch (error) {
      this.handlePrismaError(error, "Product category");
    }
  }

  /**
   * Delete product category
   */
  async deleteCategory(categoryId: string, organizationId: string): Promise<void> {
    await this.verifyOrganizationAccess(organizationId);

    // Check if category has products
    const productCount = await this.prisma.product.count({
      where: { categoryId, organizationId, deletedAt: null },
    });

    if (productCount > 0) {
      throw new Error("Cannot delete category with existing products");
    }

    try {
      await this.prisma.productCategory.delete({
        where: { id: categoryId, organizationId },
      });
    } catch (error) {
      this.handlePrismaError(error, "Product category");
    }
  }

  // ===== PRODUCT CARDS =====

  /**
   * Create product card
   */
  async createCard(data: CreateProductCardInput) {
    await this.verifyOrganizationAccess(data.organizationId);

    try {
      return await this.prisma.productCard.create({
        data,
        include: {
          organization: true,
        },
      });
    } catch (error) {
      this.handlePrismaError(error, "Product card");
    }
  }

  /**
   * Get cards for organization
   */
  async getCards(organizationId: string, includeInactive = false) {
    await this.verifyOrganizationAccess(organizationId);

    return await this.prisma.productCard.findMany({
      where: {
        organizationId,
        ...(includeInactive ? {} : { active: true }),
      },
      include: {
        organization: true,
      },
      orderBy: { cardName: "asc" },
    });
  }

  // ===== MEASURES =====

  /**
   * Create measure
   */
  async createMeasure(data: CreateMeasureInput) {
    await this.verifyOrganizationAccess(data.organizationId);

    try {
      return await this.prisma.measure.create({
        data,
        include: {
          organization: true,
        },
      });
    } catch (error) {
      this.handlePrismaError(error, "Measure");
    }
  }

  /**
   * Get measures for organization
   */
  async getMeasures(organizationId: string) {
    await this.verifyOrganizationAccess(organizationId);

    return await this.prisma.measure.findMany({
      where: { organizationId },
      include: {
        organization: true,
      },
      orderBy: { name: "asc" },
    });
  }

  // ===== PRODUCTS =====

  /**
   * Create product
   */
  async createProduct(data: CreateProductInput): Promise<ProductWithRelations> {
    await this.verifyOrganizationAccess(data.organizationId);

    try {
      return await this.prisma.product.create({
        data,
        include: {
          organization: true,
          category: true,
          card: true,
          stocks: {
            include: {
              measure: true,
            },
          },
          _count: {
            select: {
              stocks: true,
              comboProducts: true,
            },
          },
        },
      });
    } catch (error) {
      this.handlePrismaError(error, "Product");
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(
    productId: string,
    organizationId: string
  ): Promise<ProductWithRelations> {
    await this.verifyOrganizationAccess(organizationId);

    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        organizationId,
        deletedAt: null,
      },
      include: {
        organization: true,
        category: true,
        card: true,
        stocks: {
          include: {
            measure: true,
          },
        },
        _count: {
          select: {
            stocks: true,
            comboProducts: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundError("Product");
    }

    return product;
  }

  /**
   * List products with pagination and filters
   */
  async listProducts(query: ProductListQueryInput): Promise<PaginatedResult<ProductWithRelations>> {
    await this.verifyOrganizationAccess(query.organizationId);

    const {
      organizationId,
      page,
      limit,
      search,
      categoryId,
      status,
      isVisible,
      hasStock,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder,
    } = query;

    const { skip, take } = this.buildPagination(page, limit);

    const where = {
      organizationId,
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { abbreviation: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(categoryId && { categoryId }),
      ...(status && { status: { in: status } }),
      ...(isVisible !== undefined && { isVisible }),
      ...(minPrice !== undefined && { price: { gte: minPrice } }),
      ...(maxPrice !== undefined && { price: { lte: maxPrice } }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          organization: true,
          category: true,
          card: true,
          stocks: {
            include: {
              measure: true,
            },
          },
          _count: {
            select: {
              stocks: true,
              comboProducts: true,
            },
          },
        },
        orderBy: this.buildOrderBy(sortBy, sortOrder),
        skip,
        take,
      }),
      this.prisma.product.count({ where }),
    ]);

    return this.createPaginatedResult(products, total, page, limit);
  }

  /**
   * Search products
   */
  async searchProducts(query: ProductSearchInput): Promise<ProductWithRelations[]> {
    await this.verifyOrganizationAccess(query.organizationId);

    const { organizationId, query: searchQuery, categoryIds, minPrice, maxPrice, inStock } = query;

    const where = {
      organizationId,
      deletedAt: null,
      active: true,
      OR: [
        { name: { contains: searchQuery, mode: "insensitive" as const } },
        { abbreviation: { contains: searchQuery, mode: "insensitive" as const } },
      ],
      ...(categoryIds?.length && { categoryId: { in: categoryIds } }),
      ...(minPrice !== undefined && { price: { gte: minPrice } }),
      ...(maxPrice !== undefined && { price: { lte: maxPrice } }),
      ...(inStock && {
        stocks: {
          some: {
            stockQuantity: { gt: 0 },
          },
        },
      }),
    };

    return await this.prisma.product.findMany({
      where,
      include: {
        organization: true,
        category: true,
        card: true,
        stocks: {
          include: {
            measure: true,
          },
        },
        _count: {
          select: {
            stocks: true,
            comboProducts: true,
          },
        },
      },
      orderBy: { name: "asc" },
      take: 50, // Limit search results
    });
  }

  /**
   * Update product
   */
  async updateProduct(
    productId: string,
    organizationId: string,
    data: UpdateProductInput
  ): Promise<ProductWithRelations> {
    await this.verifyOrganizationAccess(organizationId);

    try {
      return await this.prisma.product.update({
        where: { id: productId, organizationId },
        data,
        include: {
          organization: true,
          category: true,
          card: true,
          stocks: {
            include: {
              measure: true,
            },
          },
          _count: {
            select: {
              stocks: true,
              comboProducts: true,
            },
          },
        },
      });
    } catch (error) {
      this.handlePrismaError(error, "Product");
    }
  }

  /**
   * Soft delete product
   */
  async deleteProduct(productId: string, organizationId: string): Promise<ProductWithRelations> {
    await this.verifyOrganizationAccess(organizationId);

    try {
      return await this.prisma.product.update({
        where: { id: productId, organizationId },
        data: { deletedAt: new Date() },
        include: {
          organization: true,
          category: true,
          card: true,
          stocks: {
            include: {
              measure: true,
            },
          },
          _count: {
            select: {
              stocks: true,
              comboProducts: true,
            },
          },
        },
      });
    } catch (error) {
      this.handlePrismaError(error, "Product");
    }
  }

  /**
   * Restore soft deleted product
   */
  async restoreProduct(productId: string, organizationId: string): Promise<ProductWithRelations> {
    await this.verifyOrganizationAccess(organizationId);

    try {
      return await this.prisma.product.update({
        where: { id: productId, organizationId },
        data: { deletedAt: null },
        include: {
          organization: true,
          category: true,
          card: true,
          stocks: {
            include: {
              measure: true,
            },
          },
          _count: {
            select: {
              stocks: true,
              comboProducts: true,
            },
          },
        },
      });
    } catch (error) {
      this.handlePrismaError(error, "Product");
    }
  }

  // ===== STOCK MANAGEMENT =====

  /**
   * Create product stock
   */
  async createStock(data: CreateProductStockInput): Promise<ProductStockWithMeasure> {
    await this.verifyOrganizationAccess(data.organizationId);

    try {
      return await this.prisma.productStock.create({
        data,
        include: {
          measure: true,
          product: true,
        },
      });
    } catch (error) {
      this.handlePrismaError(error, "Product stock");
    }
  }

  /**
   * Update product stock
   */
  async updateStock(
    stockId: string,
    organizationId: string,
    data: UpdateProductStockInput
  ): Promise<ProductStockWithMeasure> {
    await this.verifyOrganizationAccess(organizationId);

    try {
      return await this.prisma.productStock.update({
        where: { id: stockId, organizationId },
        data,
        include: {
          measure: true,
          product: true,
        },
      });
    } catch (error) {
      this.handlePrismaError(error, "Product stock");
    }
  }

  /**
   * Bulk update stock quantities
   */
  async bulkUpdateStock(data: BulkUpdateStockInput): Promise<void> {
    await this.verifyOrganizationAccess(data.organizationId);

    try {
      await this.withTransaction(async (tx) => {
        for (const update of data.updates) {
          await tx.productStock.updateMany({
            where: {
              organizationId: data.organizationId,
              productId: update.productId,
              measureId: update.measureId,
            },
            data: {
              stockQuantity: update.stockQuantity,
              updatedAt: new Date(),
            },
          });
        }
      });
    } catch (error) {
      this.handlePrismaError(error, "Bulk stock update");
    }
  }

  /**
   * Get stock for product
   */
  async getProductStock(
    productId: string,
    organizationId: string
  ): Promise<ProductStockWithMeasure[]> {
    await this.verifyOrganizationAccess(organizationId);

    return await this.prisma.productStock.findMany({
      where: { productId, organizationId },
      include: {
        measure: true,
        product: true,
      },
      orderBy: { measure: { name: "asc" } },
    });
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(
    organizationId: string,
    threshold = 10
  ): Promise<ProductWithRelations[]> {
    await this.verifyOrganizationAccess(organizationId);

    return await this.prisma.product.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: "active",
        stocks: {
          some: {
            stockQuantity: { lte: threshold },
          },
        },
      },
      include: {
        organization: true,
        category: true,
        card: true,
        stocks: {
          include: {
            measure: true,
          },
          where: {
            stockQuantity: { lte: threshold },
          },
        },
        _count: {
          select: {
            stocks: true,
            comboProducts: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }
}

export const productService = new ProductService();
