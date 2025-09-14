
-- CreateEnum for business logic (extending existing UserRole)
CREATE TYPE "UserStatus" AS ENUM ('pending', 'approved', 'suspended');
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'canceled', 'past_due', 'trialing');
CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'USER');

-- CreateTable: Organizations (Core SaaS multi-tenancy)
-- Billing stays in users table as per your existing structure
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT UNIQUE NOT NULL,
    "domain" TEXT UNIQUE,
    "logo" TEXT,
    "owner_id" TEXT NOT NULL, -- References the user who owns this org (for Stripe billing)
    "subscription_status" "SubscriptionStatus" NOT NULL DEFAULT 'trialing',
    "trial_ends_at" TIMESTAMP(3),
    "settings" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: User-Organization relationships (SaaS memberships)
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "role" "OrganizationRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'pending',
    "invited_by" TEXT,
    "joined_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Organization invitations
CREATE TABLE "organization_invitations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "role" "OrganizationRole" NOT NULL DEFAULT 'USER',
    "invited_by" TEXT NOT NULL,
    "token" TEXT UNIQUE NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Summary Cards (Business)
CREATE TABLE "summary_cards" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "camel_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "summary_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Product Categories (Business)
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imagen_alt" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "summary_card_id" TEXT,
    "is_combo" BOOLEAN NOT NULL DEFAULT false,
    "uuid" UUID UNIQUE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Product Cards (Business)
CREATE TABLE "product_cards" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "card_name" TEXT NOT NULL,
    "camel_name" TEXT,
    "description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "image_alt" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Products (Business)
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image_alt" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "category_id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "uuid" UUID UNIQUE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Measures (Business)
CREATE TABLE "measures" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "measures_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Product Stocks (Business)
CREATE TABLE "product_stocks" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "measure_id" TEXT NOT NULL,
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Packagings (Business)
CREATE TABLE "packagings" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image_alt" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "packagings_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Packaging Stocks (Business)
CREATE TABLE "packaging_stocks" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "packaging_id" TEXT NOT NULL,
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "packaging_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Product Combo Categories (Business)
CREATE TABLE "product_combo_categories" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "uuid" UUID UNIQUE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_combo_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Product Combos (Business)
CREATE TABLE "product_combos" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "combo_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image_alt" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "packaging_id" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "modal_quick" BOOLEAN NOT NULL DEFAULT false,
    "category_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "meta_description" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "uuid" UUID UNIQUE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "product_combos_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Combo Products (Business)
CREATE TABLE "combo_products" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "combo_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "combo_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable: State Strategies (Business)
CREATE TABLE "state_strategies" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "state_strategies_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Product Rules (Business)
CREATE TABLE "product_rules" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "strategy_id" TEXT NOT NULL,
    "limit" INTEGER,
    "exempt" INTEGER,
    "alert" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Combo Allowed Categories (Business)
CREATE TABLE "combo_allowed_categories" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "combo_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "rule_id" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "combo_allowed_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Combo Product Excludes (Business)
CREATE TABLE "combo_product_excludes" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "combo_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "combo_product_excludes_pkey" PRIMARY KEY ("id")
);

-- NO modifications to existing users table - keeping Stripe fields intact
-- Billing remains in users table as per your existing NextAuth + Stripe setup

-- CreateIndex: Organization indexes
CREATE INDEX "organizations_slug_idx" ON "organizations"("slug");
CREATE INDEX "organizations_domain_idx" ON "organizations"("domain");
CREATE INDEX "organizations_owner_id_idx" ON "organizations"("owner_id");

-- CreateIndex: Organization member indexes
CREATE INDEX "organization_members_user_id_idx" ON "organization_members"("user_id");
CREATE INDEX "organization_members_organization_id_idx" ON "organization_members"("organization_id");
CREATE UNIQUE INDEX "organization_members_user_id_organization_id_key" ON "organization_members"("user_id", "organization_id");

-- CreateIndex: Organization invitation indexes
CREATE INDEX "organization_invitations_organization_id_idx" ON "organization_invitations"("organization_id");
CREATE INDEX "organization_invitations_email_idx" ON "organization_invitations"("email");

-- CreateIndex: Business logic indexes for multi-tenant isolation
CREATE INDEX "summary_cards_organization_id_idx" ON "summary_cards"("organization_id");
CREATE INDEX "product_categories_organization_id_idx" ON "product_categories"("organization_id");
CREATE INDEX "product_cards_organization_id_idx" ON "product_cards"("organization_id");
CREATE INDEX "products_organization_id_idx" ON "products"("organization_id");
CREATE INDEX "measures_organization_id_idx" ON "measures"("organization_id");
CREATE INDEX "product_stocks_organization_id_idx" ON "product_stocks"("organization_id");
CREATE INDEX "packagings_organization_id_idx" ON "packagings"("organization_id");
CREATE INDEX "packaging_stocks_organization_id_idx" ON "packaging_stocks"("organization_id");
CREATE INDEX "product_combo_categories_organization_id_idx" ON "product_combo_categories"("organization_id");
CREATE INDEX "product_combos_organization_id_idx" ON "product_combos"("organization_id");
CREATE INDEX "combo_products_organization_id_idx" ON "combo_products"("organization_id");
CREATE INDEX "state_strategies_organization_id_idx" ON "state_strategies"("organization_id");
CREATE INDEX "product_rules_organization_id_idx" ON "product_rules"("organization_id");
CREATE INDEX "combo_allowed_categories_organization_id_idx" ON "combo_allowed_categories"("organization_id");
CREATE INDEX "combo_product_excludes_organization_id_idx" ON "combo_product_excludes"("organization_id");

-- CreateIndex: Unique constraints per organization for SaaS isolation
CREATE UNIQUE INDEX "products_organization_id_abbreviation_key" ON "products"("organization_id", "abbreviation");
CREATE UNIQUE INDEX "measures_organization_id_name_key" ON "measures"("organization_id", "name");
CREATE UNIQUE INDEX "measures_organization_id_abbreviation_key" ON "measures"("organization_id", "abbreviation");
CREATE UNIQUE INDEX "packagings_organization_id_name_key" ON "packagings"("organization_id", "name");
CREATE UNIQUE INDEX "product_combos_organization_id_abbreviation_key" ON "product_combos"("organization_id", "abbreviation");

-- AddForeignKey: Organization relationships
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Business logic relationships with SaaS isolation
ALTER TABLE "summary_cards" ADD CONSTRAINT "summary_cards_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_summary_card_id_fkey" FOREIGN KEY ("summary_card_id") REFERENCES "summary_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "product_cards" ADD CONSTRAINT "product_cards_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "products" ADD CONSTRAINT "products_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "product_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "measures" ADD CONSTRAINT "measures_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_stocks" ADD CONSTRAINT "product_stocks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_stocks" ADD CONSTRAINT "product_stocks_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_stocks" ADD CONSTRAINT "product_stocks_measure_id_fkey" FOREIGN KEY ("measure_id") REFERENCES "measures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "packagings" ADD CONSTRAINT "packagings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "packaging_stocks" ADD CONSTRAINT "packaging_stocks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "packaging_stocks" ADD CONSTRAINT "packaging_stocks_packaging_id_fkey" FOREIGN KEY ("packaging_id") REFERENCES "packagings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "product_combo_categories" ADD CONSTRAINT "product_combo_categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_combos" ADD CONSTRAINT "product_combos_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_combos" ADD CONSTRAINT "product_combos_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_combo_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_combos" ADD CONSTRAINT "product_combos_packaging_id_fkey" FOREIGN KEY ("packaging_id") REFERENCES "packagings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "combo_products" ADD CONSTRAINT "combo_products_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "combo_products" ADD CONSTRAINT "combo_products_combo_id_fkey" FOREIGN KEY ("combo_id") REFERENCES "product_combos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "combo_products" ADD CONSTRAINT "combo_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "state_strategies" ADD CONSTRAINT "state_strategies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_rules" ADD CONSTRAINT "product_rules_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_rules" ADD CONSTRAINT "product_rules_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "state_strategies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "combo_allowed_categories" ADD CONSTRAINT "combo_allowed_categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "combo_allowed_categories" ADD CONSTRAINT "combo_allowed_categories_combo_id_fkey" FOREIGN KEY ("combo_id") REFERENCES "product_combos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "combo_allowed_categories" ADD CONSTRAINT "combo_allowed_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "combo_allowed_categories" ADD CONSTRAINT "combo_allowed_categories_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "product_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "combo_product_excludes" ADD CONSTRAINT "combo_product_excludes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "combo_product_excludes" ADD CONSTRAINT "combo_product_excludes_combo_id_fkey" FOREIGN KEY ("combo_id") REFERENCES "product_combos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "combo_product_excludes" ADD CONSTRAINT "combo_product_excludes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
