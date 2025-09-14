import "server-only";

import { BaseService, NotFoundError, ValidationError } from "./base.service";
import type {
  CreateProductComboInput,
  UpdateProductComboInput,
  ComboWithProductsInput,
  CreateProductComboCategoryInput,
  UpdateProductComboCategoryInput,
  BulkUpdateComboProductsInput,
  ComboListQueryInput,
  ComboSearchInput,
  PublicComboLookupInput,
} from "@/lib/validations/combo";
import type {
  ProductComboWithRelations,
  ProductComboCategory,
  ComboProductWithProduct,
  PaginatedResult,
  ComboInventory,
} from "@/types/database";

export class ComboService extends BaseService {
  // ===== COMBO CATEGORIES =====

  /**
   * Create combo category
   */
  async createCategory(data: CreateProductComboCategoryInput): Promise<ProductComboCategory> {
    await this.verifyOrganizationAccess(data.organizationId);

    try {
      return await this.prisma.productComboCategory.create({
        data,
        include: {
          organization: true,
        },
      });
    } catch (error) {
      this.handlePrismaError(error, "Combo category");
    }
  }

  /**
   * Get combo categories for organization
   */
  async getCategories(
    organizationId: string,
    includeInactive = false
  ): Promise<ProductComboCategory[]> {
    await this.verifyOrganizationAccess(organizationId);

    return await this.prisma.productComboCategory.findMany({
      where: {
        organizationId,
        ...(includeInactive ? {} : { active: true }),
      },
      include: {
        organization: true,
        _count: {
          select: { productCombos: true },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  // ===== PRODUCT COMBOS =====

  /**
   * Create product combo
   */
  async createCombo(data: CreateProductComboInput): Promise<ProductComboWithRelations> {
    await this.verifyOrganizationAccess(data.organizationId);

    // Verify category and packaging exist
    await this.validateComboReferences(data.organizationId, data.categoryId, data.packagingId);

    try {
      return await this.prisma.productCombo.create({
        data,
        include: {
          organization: true,
          category: true,
          packaging: true,
          comboProducts: {
            include: {
              product: {
                include: {
                  category: true,
                  stocks: {
                    include: { measure: true },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              comboProducts: true,
              comboAllowedCategories: true,
            },
          },
        },
      });
    } catch (error) {
      this.handlePrismaError(error, "Product combo");
    }
  }

  /**
   * Create combo with products in one transaction
   */
  async createComboWithProducts(data: ComboWithProductsInput): Promise<ProductComboWithRelations> {
    await this.verifyOrganizationAccess(data.organizationId);

    const { products, allowedCategories, excludedProducts, ...comboData } = data;

    // Verify all products exist and belong to organization
    await this.validateComboProducts(data.organizationId, products);

    try {
      return await this.withTransaction(async (tx) => {
        // Create combo
        const combo = await tx.productCombo.create({
          data: comboData,
        });

        // Add products to combo
        await tx.comboProduct.createMany({
          data: products.map((product) => ({
            organizationId: data.organizationId,
            comboId: combo.id,
            productId: product.productId,
            quantity: product.quantity,
          })),
        });

        // Add allowed categories if specified
        if (allowedCategories?.length) {
          await tx.comboAllowedCategory.createMany({
            data: allowedCategories.map((category) => ({
              organizationId: data.organizationId,
              comboId: combo.id,
              categoryId: category.categoryId,
              ruleId: category.ruleId,
              isRequired: category.isRequired,
            })),
          });
        }

        // Add excluded products if specified
        if (excludedProducts?.length) {
          await tx.comboProductExclude.createMany({
            data: excludedProducts.map((productId) => ({
              organizationId: data.organizationId,
              comboId: combo.id,
              productId,
            })),
          });
        }

        // Return combo with all relations
        return await tx.productCombo.findUnique({
          where: { id: combo.id },
          include: {
            organization: true,
            category: true,
            packaging: true,
            comboProducts: {
              include: {
                product: {
                  include: {
                    category: true,
                    stocks: {
                      include: { measure: true },
                    },
                  },
                },
              },
            },
            comboAllowedCategories: {
              include: {
                category: true,
                rule: true,
              },
            },
            comboProductExcludes: {
              include: {
                product: true,
              },
            },
            _count: {
              select: {
                comboProducts: true,
                comboAllowedCategories: true,
              },
            },
          },
        }) as ProductComboWithRelations;
      });
    } catch (error) {
      this.handlePrismaError(error, "Product combo with products");
    }
  }

  /**
   * Get combo by ID
   */
  async getComboById(
    comboId: string,
    organizationId: string
  ): Promise<ProductComboWithRelations> {
    await this.verifyOrganizationAccess(organizationId);

    const combo = await this.prisma.productCombo.findFirst({
      where: {
        id: comboId,
        organizationId,
        deletedAt: null,
      },
      include: {
        organization: true,
        category: true,
        packaging: true,
        comboProducts: {
          include: {
            product: {
              include: {
                category: true,
                stocks: {
                  include: { measure: true },
                },
              },
            },
          },
        },
        comboAllowedCategories: {
          include: {
            category: true,
            rule: true,
          },
        },
        comboProductExcludes: {
          include: {
            product: true,
          },
        },
        _count: {
          select: {
            comboProducts: true,
            comboAllowedCategories: true,
          },
        },
      },
    });

    if (!combo) {
      throw new NotFoundError("Product combo");
    }

    return combo;
  }

  /**
   * Get combo by slug (for public access)
   */
  async getComboBySlug(data: PublicComboLookupInput): Promise<ProductComboWithRelations> {
    // First get organization by slug
    const organization = await this.prisma.organization.findUnique({
      where: { slug: data.organizationSlug },
    });

    if (!organization) {
      throw new NotFoundError("Organization");
    }

    const combo = await this.prisma.productCombo.findFirst({
      where: {
        slug: data.comboSlug,
        organizationId: organization.id,
        active: true,
        deletedAt: null,
      },
      include: {
        organization: true,
        category: true,
        packaging: true,
        comboProducts: {
          include: {
            product: {
              include: {
                category: true,
                stocks: {
                  include: { measure: true },
                },
              },
            },
          },
        },
        _count: {
          select: {
            comboProducts: true,
            comboAllowedCategories: true,
          },
        },
      },
    });

    if (!combo) {
      throw new NotFoundError("Product combo");
    }

    return combo;
  }

  /**
   * List combos with pagination and filters
   */
  async listCombos(query: ComboListQueryInput): Promise<PaginatedResult<ProductComboWithRelations>> {
    await this.verifyOrganizationAccess(query.organizationId);

    const {
      organizationId,
      page,
      limit,
      search,
      categoryId,
      active,
      modalQuick,
      sortBy,
      sortOrder,
    } = query;

    const { skip, take } = this.buildPagination(page, limit);

    const where = {
      organizationId,
      deletedAt: null,
      ...(search && {
        OR: [
          { comboName: { contains: search, mode: "insensitive" as const } },
          { abbreviation: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(categoryId && { categoryId }),
      ...(active !== undefined && { active }),
      ...(modalQuick !== undefined && { modalQuick }),
    };

    const [combos, total] = await Promise.all([
      this.prisma.productCombo.findMany({
        where,
        include: {
          organization: true,
          category: true,
          packaging: true,
          comboProducts: {
            include: {
              product: {
                include: {
                  category: true,
                  stocks: {
                    include: { measure: true },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              comboProducts: true,
              comboAllowedCategories: true,
            },
          },
        },
        orderBy: this.buildOrderBy(sortBy, sortOrder),
        skip,
        take,
      }),
      this.prisma.productCombo.count({ where }),
    ]);

    return this.createPaginatedResult(combos, total, page, limit);
  }

  /**
   * Search combos
   */
  async searchCombos(query: ComboSearchInput): Promise<ProductComboWithRelations[]> {
    await this.verifyOrganizationAccess(query.organizationId);

    const { organizationId, query: searchQuery, categoryIds, minPrice, maxPrice, tags } = query;

    const where = {
      organizationId,
      deletedAt: null,
      active: true,
      OR: [
        { comboName: { contains: searchQuery, mode: "insensitive" as const } },
        { abbreviation: { contains: searchQuery, mode: "insensitive" as const } },
        { description: { contains: searchQuery, mode: "insensitive" as const } },
        { tags: { contains: searchQuery, mode: "insensitive" as const } },
      ],
      ...(categoryIds?.length && { categoryId: { in: categoryIds } }),
      ...(minPrice !== undefined && { price: { gte: minPrice } }),
      ...(maxPrice !== undefined && { price: { lte: maxPrice } }),
      ...(tags?.length && {
        tags: {
          contains: tags.join(" "),
          mode: "insensitive" as const,
        },
      }),
    };

    return await this.prisma.productCombo.findMany({
      where,
      include: {
        organization: true,
        category: true,
        packaging: true,
        comboProducts: {
          include: {
            product: {
              include: {
                category: true,
                stocks: {
                  include: { measure: true },
                },
              },
            },
          },
        },
        _count: {
          select: {
            comboProducts: true,
            comboAllowedCategories: true,
          },
        },
      },
      orderBy: { comboName: "asc" },
      take: 50, // Limit search results
    });
  }

  /**
   * Update combo
   */
  async updateCombo(
    comboId: string,
    organizationId: string,
    data: UpdateProductComboInput
  ): Promise<ProductComboWithRelations> {
    await this.verifyOrganizationAccess(organizationId);

    try {
      return await this.prisma.productCombo.update({
        where: { id: comboId, organizationId },
        data,
        include: {
          organization: true,
          category: true,
          packaging: true,
          comboProducts: {
            include: {
              product: {
                include: {
                  category: true,
                  stocks: {
                    include: { measure: true },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              comboProducts: true,
              comboAllowedCategories: true,
            },
          },
        },
      });
    } catch (error) {
      this.handlePrismaError(error, "Product combo");
    }
  }

  /**
   * Bulk update combo products
   */
  async updateComboProducts(data: BulkUpdateComboProductsInput): Promise<void> {
    await this.verifyOrganizationAccess(data.organizationId);

    // Verify combo exists
    const combo = await this.prisma.productCombo.findFirst({
      where: { id: data.comboId, organizationId: data.organizationId },
    });

    if (!combo) {
      throw new NotFoundError("Product combo");
    }

    // Verify all products exist
    await this.validateComboProducts(data.organizationId, data.products);

    try {
      await this.withTransaction(async (tx) => {
        // Remove existing products
        await tx.comboProduct.deleteMany({
          where: { comboId: data.comboId, organizationId: data.organizationId },
        });

        // Add new products
        await tx.comboProduct.createMany({
          data: data.products.map((product) => ({
            organizationId: data.organizationId,
            comboId: data.comboId,
            productId: product.productId,
            quantity: product.quantity,
          })),
        });
      });
    } catch (error) {
      this.handlePrismaError(error, "Update combo products");
    }
  }

  /**
   * Soft delete combo
   */
  async deleteCombo(comboId: string, organizationId: string): Promise<ProductComboWithRelations> {
    await this.verifyOrganizationAccess(organizationId);

    try {
      return await this.prisma.productCombo.update({
        where: { id: comboId, organizationId },
        data: { deletedAt: new Date() },
        include: {
          organization: true,
          category: true,
          packaging: true,
          comboProducts: {
            include: {
              product: {
                include: {
                  category: true,
                  stocks: {
                    include: { measure: true },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              comboProducts: true,
              comboAllowedCategories: true,
            },
          },
        },
      });
    } catch (error) {
      this.handlePrismaError(error, "Product combo");
    }
  }

  /**
   * Check combo inventory availability
   */
  async checkComboInventory(
    comboId: string,
    organizationId: string,
    requestedQuantity = 1
  ): Promise<ComboInventory> {
    await this.verifyOrganizationAccess(organizationId);

    const combo = await this.getComboById(comboId, organizationId);
    const missingProducts: ComboInventory["missingProducts"] = [];
    let maxQuantity = Infinity;

    for (const comboProduct of combo.comboProducts || []) {
      const product = comboProduct.product;
      const requiredQuantity = comboProduct.quantity * requestedQuantity;

      // Calculate total available stock across all measures
      const totalStock = product?.stocks?.reduce((sum, stock) => sum + stock.stockQuantity, 0) || 0;

      if (totalStock < requiredQuantity) {
        missingProducts.push({
          product: product!,
          needed: requiredQuantity,
          available: totalStock,
        });
      }

      // Calculate max possible quantity for this product
      const maxForThisProduct = Math.floor(totalStock / comboProduct.quantity);
      maxQuantity = Math.min(maxQuantity, maxForThisProduct);
    }

    return {
      combo,
      canBeMade: missingProducts.length === 0,
      maxQuantity: maxQuantity === Infinity ? 0 : Math.max(0, maxQuantity),
      missingProducts,
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Validate combo references (category, packaging)
   */
  private async validateComboReferences(
    organizationId: string,
    categoryId: string,
    packagingId: string
  ): Promise<void> {
    const [category, packaging] = await Promise.all([
      this.prisma.productComboCategory.findFirst({
        where: { id: categoryId, organizationId },
      }),
      this.prisma.packaging.findFirst({
        where: { id: packagingId, organizationId },
      }),
    ]);

    if (!category) {
      throw new ValidationError("Invalid combo category", "categoryId");
    }

    if (!packaging) {
      throw new ValidationError("Invalid packaging", "packagingId");
    }
  }

  /**
   * Validate combo products exist and belong to organization
   */
  private async validateComboProducts(
    organizationId: string,
    products: Array<{ productId: string; quantity: number }>
  ): Promise<void> {
    const productIds = products.map((p) => p.productId);

    const existingProducts = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        organizationId,
        deletedAt: null,
        status: "active",
      },
    });

    if (existingProducts.length !== productIds.length) {
      const foundIds = existingProducts.map((p) => p.id);
      const missingIds = productIds.filter((id) => !foundIds.includes(id));
      throw new ValidationError(`Invalid products: ${missingIds.join(", ")}`);
    }
  }
}

export const comboService = new ComboService();
