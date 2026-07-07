-- Delivery optimization indexes.
-- Safe to run multiple times on Neon/PostgreSQL.

CREATE INDEX IF NOT EXISTS idx_suppliers_business_active_name
  ON suppliers(business_id, is_active, name);

CREATE INDEX IF NOT EXISTS idx_users_business_active_name
  ON users(business_id, is_active, full_name);

CREATE INDEX IF NOT EXISTS idx_users_business_usercode_lookup
  ON users(business_id, LOWER(user_code));

CREATE INDEX IF NOT EXISTS idx_product_categories_business_active_name
  ON product_categories(business_id, is_active, name);

CREATE INDEX IF NOT EXISTS idx_products_business_active_name
  ON products(business_id, is_active, name);

CREATE INDEX IF NOT EXISTS idx_products_business_barcode
  ON products(business_id, barcode)
  WHERE barcode IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stock_movements_business_type_occurred
  ON stock_movements(business_id, movement_type, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_stock_movements_business_product_occurred
  ON stock_movements(business_id, product_id, occurred_at DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_counts_business_created
  ON inventory_counts(business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_counts_business_status_created
  ON inventory_counts(business_id, status, created_at DESC);
