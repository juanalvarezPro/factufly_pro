-- Migration: Add missing indexes and constraints for performance and data integrity
-- Description: This migration adds critical missing indexes and constraints identified in the audit
-- Author: AI Agent
-- Date: 2025-09-14

-- ==========================================
-- PERFORMANCE INDEXES
-- ==========================================

-- Add missing indexes for soft delete queries (critical for performance)
CREATE INDEX IF NOT EXISTS "products_deleted_at_idx" ON "products"("deleted_at") WHERE "deleted_at" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "product_combos_deleted_at_idx" ON "product_combos"("deleted_at") WHERE "deleted_at" IS NOT NULL;

-- Add composite indexes for common query patterns (organization + active status)
CREATE INDEX IF NOT EXISTS "products_org_active_idx" ON "products"("organization_id", "active") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "product_combos_org_active_idx" ON "product_combos"("organization_id", "active") WHERE "deleted_at" IS NULL;

-- Add index for SEO slug lookups (critical for public-facing combo pages)
CREATE INDEX IF NOT EXISTS "product_combos_slug_idx" ON "product_combos"("slug") WHERE "active" = true AND "deleted_at" IS NULL;

-- Add indexes for pricing and stock queries
CREATE INDEX IF NOT EXISTS "products_price_idx" ON "products"("price") WHERE "active" = true AND "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "product_stocks_quantity_idx" ON "product_stocks"("stock_quantity");
CREATE INDEX IF NOT EXISTS "packaging_stocks_quantity_idx" ON "packaging_stocks"("stock_quantity");

-- ==========================================
-- DATA INTEGRITY CONSTRAINTS
-- ==========================================

-- Add CHECK constraints for positive prices (prevent negative pricing)
ALTER TABLE "products" ADD CONSTRAINT "products_price_positive" CHECK ("price" > 0);
ALTER TABLE "packagings" ADD CONSTRAINT "packagings_price_positive" CHECK ("price" > 0);
ALTER TABLE "product_combos" ADD CONSTRAINT "product_combos_price_positive" CHECK ("price" > 0);

-- Add CHECK constraints for non-negative stock quantities
ALTER TABLE "product_stocks" ADD CONSTRAINT "product_stocks_quantity_non_negative" CHECK ("stock_quantity" >= 0);
ALTER TABLE "packaging_stocks" ADD CONSTRAINT "packaging_stocks_quantity_non_negative" CHECK ("stock_quantity" >= 0);

-- Add CHECK constraints for combo product quantities (must be positive)
ALTER TABLE "combo_products" ADD CONSTRAINT "combo_products_quantity_positive" CHECK ("quantity" > 0);

-- Add CHECK constraints for product rule limits (if specified, must be positive)
ALTER TABLE "product_rules" ADD CONSTRAINT "product_rules_limit_positive" CHECK ("limit" IS NULL OR "limit" > 0);
ALTER TABLE "product_rules" ADD CONSTRAINT "product_rules_exempt_non_negative" CHECK ("exempt" IS NULL OR "exempt" >= 0);

-- ==========================================
-- ORGANIZATION SLUG CONSTRAINTS
-- ==========================================

-- Add constraint to ensure organization slugs are URL-safe (lowercase, alphanumeric, hyphens)
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_slug_format" 
    CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND LENGTH("slug") >= 3 AND LENGTH("slug") <= 50);

-- Add constraint to ensure product combo slugs are URL-safe
ALTER TABLE "product_combos" ADD CONSTRAINT "product_combos_slug_format" 
    CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND LENGTH("slug") >= 3 AND LENGTH("slug") <= 100);

-- ==========================================
-- UNIQUE CONSTRAINTS FOR BUSINESS LOGIC
-- ==========================================

-- Ensure product abbreviations are unique within organization (already exists but ensuring)
-- This is already handled in the migration, just documenting

-- Ensure combo slugs are unique within organization for SEO
CREATE UNIQUE INDEX IF NOT EXISTS "product_combos_organization_id_slug_key" ON "product_combos"("organization_id", "slug");

-- Ensure packaging names are unique within organization (already exists)
-- This is already handled in the migration

-- ==========================================
-- AUDIT TRAIL TRIGGERS (Optional - for future consideration)
-- ==========================================

-- Note: Audit triggers for tracking changes to products/combos can be added later
-- This would track who changed what and when for business auditing purposes

-- ==========================================
-- PERFORMANCE HINTS AND DOCUMENTATION
-- ==========================================

-- COMMENT ON INDEX products_org_active_idx IS 'Optimizes queries for active products within an organization';
-- COMMENT ON INDEX product_combos_slug_idx IS 'Optimizes SEO-friendly URL lookups for public combo pages';
-- COMMENT ON CONSTRAINT products_price_positive IS 'Ensures all product prices are positive values';
-- COMMENT ON CONSTRAINT organizations_slug_format IS 'Ensures organization slugs are URL-safe and within length limits';
