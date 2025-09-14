import type {
  User,
  Organization,
  OrganizationMember,
  OrganizationInvitation,
  SummaryCard,
  ProductCategory,
  ProductCard,
  Product,
  Measure,
  ProductStock,
  Packaging,
  PackagingStock,
  ProductComboCategory,
  ProductCombo,
  ComboProduct,
  StateStrategy,
  ProductRule,
  ComboAllowedCategory,
  ComboProductExclude,
  UserRole,
  UserStatus,
  SubscriptionStatus,
  OrganizationRole,
} from "@prisma/client";

// ===== EXTENDED TYPES WITH RELATIONS =====

export type UserWithRelations = User & {
  ownedOrganizations?: Organization[];
  organizationMembers?: OrganizationMember[];
  accounts?: any[];
  sessions?: any[];
};

export type OrganizationWithRelations = Organization & {
  owner?: User;
  members?: OrganizationMemberWithUser[];
  _count?: {
    members: number;
    products: number;
    productCombos: number;
  };
};

export type OrganizationMemberWithUser = OrganizationMember & {
  user: User;
  organization?: Organization;
};

export type ProductWithRelations = Product & {
  organization?: Organization;
  category?: ProductCategory;
  card?: ProductCard;
  stocks?: ProductStockWithMeasure[];
  comboProducts?: ComboProduct[];
  _count?: {
    stocks: number;
    comboProducts: number;
  };
};

export type ProductStockWithMeasure = ProductStock & {
  measure?: Measure;
  product?: Product;
};

export type ProductCategoryWithRelations = ProductCategory & {
  organization?: Organization;
  summaryCard?: SummaryCard | null;
  products?: Product[];
  _count?: {
    products: number;
  };
};

export type ProductComboWithRelations = ProductCombo & {
  organization?: Organization;
  category?: ProductComboCategory;
  packaging?: Packaging;
  comboProducts?: ComboProductWithProduct[];
  comboAllowedCategories?: ComboAllowedCategoryWithRelations[];
  comboProductExcludes?: ComboProductExcludeWithProduct[];
  _count?: {
    comboProducts: number;
    comboAllowedCategories: number;
  };
};

export type ComboProductWithProduct = ComboProduct & {
  product?: ProductWithRelations;
  combo?: ProductCombo;
};

export type ComboAllowedCategoryWithRelations = ComboAllowedCategory & {
  category?: ProductCategory;
  rule?: ProductRule | null;
  combo?: ProductCombo;
};

export type ComboProductExcludeWithProduct = ComboProductExclude & {
  product?: Product;
  combo?: ProductCombo;
};

export type PackagingWithStock = Packaging & {
  stocks?: PackagingStock[];
  _count?: {
    stocks: number;
    productCombos: number;
  };
};

export type StateStrategyWithRules = StateStrategy & {
  productRules?: ProductRule[];
  _count?: {
    productRules: number;
  };
};

// ===== BUSINESS LOGIC TYPES =====

export interface ProductInventory {
  product: ProductWithRelations;
  totalStock: number;
  stockByMeasure: Array<{
    measure: Measure;
    quantity: number;
  }>;
  lowStock: boolean;
}

export interface ComboInventory {
  combo: ProductComboWithRelations;
  canBeMade: boolean;
  maxQuantity: number;
  missingProducts: Array<{
    product: Product;
    needed: number;
    available: number;
  }>;
}

export interface OrganizationStats {
  totalProducts: number;
  totalCombos: number;
  totalCategories: number;
  activeProducts: number;
  activeCombos: number;
  lowStockProducts: number;
  totalRevenue?: number;
  popularProducts?: Array<{
    product: Product;
    sales: number;
  }>;
}

// ===== PERMISSION TYPES =====

export interface UserPermissions {
  organizationId: string;
  role: OrganizationRole;
  canCreateProducts: boolean;
  canEditProducts: boolean;
  canDeleteProducts: boolean;
  canCreateCombos: boolean;
  canEditCombos: boolean;
  canDeleteCombos: boolean;
  canManageMembers: boolean;
  canManageOrganization: boolean;
  canViewReports: boolean;
  canManageStock: boolean;
}

export interface ResourcePermission {
  action: "CREATE" | "READ" | "UPDATE" | "DELETE";
  resource: "PRODUCT" | "COMBO" | "CATEGORY" | "ORGANIZATION" | "MEMBER";
  organizationId: string;
  resourceId?: string;
}

// ===== SEARCH AND FILTER TYPES =====

export interface ProductFilters {
  organizationId: string;
  categoryIds?: string[];
  active?: boolean;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: "name" | "price" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface ComboFilters {
  organizationId: string;
  categoryIds?: string[];
  active?: boolean;
  modalQuick?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  tags?: string[];
  sortBy?: "comboName" | "price" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

// ===== API RESPONSE TYPES =====

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

// ===== AUDIT AND TRACKING TYPES =====

export interface AuditEntry {
  id: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "RESTORE";
  entityType: string;
  entityId: string;
  organizationId: string;
  userId: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface ActivityLog {
  id: string;
  type: "PRODUCT_CREATED" | "COMBO_CREATED" | "STOCK_UPDATED" | "MEMBER_INVITED";
  organizationId: string;
  userId: string;
  entityId?: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

// ===== EXPORT COMMONLY USED PRISMA TYPES =====

export type {
  User,
  Organization,
  OrganizationMember,
  OrganizationInvitation,
  SummaryCard,
  ProductCategory,
  ProductCard,
  Product,
  Measure,
  ProductStock,
  Packaging,
  PackagingStock,
  ProductComboCategory,
  ProductCombo,
  ComboProduct,
  StateStrategy,
  ProductRule,
  ComboAllowedCategory,
  ComboProductExclude,
  UserRole,
  UserStatus,
  SubscriptionStatus,
  OrganizationRole,
} from "@prisma/client";
