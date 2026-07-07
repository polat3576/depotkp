const { query } = require('../database/connection');

// Sadece veritabanı erişimi. Tüm sorgular business_id ile filtrelenir (multi-tenant).
// Listeleme sorguları okunabilirlik için kategori, birim ve varsayılan tedarikçi
// adını da join'ler.

const SELECT_WITH_RELATIONS = `
  SELECT
    p.id, p.business_id, p.category_id, p.unit_id, p.default_supplier_id,
    p.name, p.sku, p.barcode,
    p.current_stock, p.min_stock_level, p.is_active,
    p.created_at, p.updated_at,
    c.name AS category_name,
    u.name AS unit_name,
    u.short_name AS unit_short_name,
    s.name AS default_supplier_name
  FROM products p
  JOIN product_categories c ON c.id = p.category_id
  JOIN units u ON u.id = p.unit_id
  LEFT JOIN suppliers s ON s.id = p.default_supplier_id
`;

// İşletmenin ürünleri. Varsayılan olarak sadece aktif olanlar döner.
async function findAllForBusiness(businessId, { includeInactive = false } = {}) {
  const sql = `
    ${SELECT_WITH_RELATIONS}
    WHERE p.business_id = $1
      AND ($2 = true OR p.is_active = true)
    ORDER BY p.name ASC
  `;
  const result = await query(sql, [businessId, includeInactive]);
  return result.rows;
}

// Tek ürün (aktif/pasif fark etmez) - işletmeye ait olmalı.
async function findById(id, businessId) {
  const sql = `
    ${SELECT_WITH_RELATIONS}
    WHERE p.id = $1 AND p.business_id = $2
    LIMIT 1
  `;
  const result = await query(sql, [id, businessId]);
  return result.rows[0] || null;
}

// Aynı işletmede aynı ürün adı var mı? (update için bir kaydı hariç tutabilir)
async function existsByName(businessId, name, excludeId = null) {
  const sql = `
    SELECT 1 FROM products
    WHERE business_id = $1 AND LOWER(name) = LOWER($2)
      AND ($3::uuid IS NULL OR id <> $3)
    LIMIT 1
  `;
  const result = await query(sql, [businessId, name, excludeId]);
  return result.rowCount > 0;
}

// current_stock burada set edilmez -> tabloda DEFAULT 0 ile başlar.
// Stok yalnızca stok hareketi modülü tarafından değiştirilecek.
async function create({
  businessId,
  categoryId,
  unitId,
  name,
  sku,
  barcode,
  minStockLevel,
  defaultSupplierId,
}) {
  const sql = `
    INSERT INTO products
      (business_id, category_id, unit_id, name, sku, barcode, min_stock_level, default_supplier_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, business_id, category_id, unit_id, default_supplier_id, name, sku, barcode,
              current_stock, min_stock_level, is_active, created_at, updated_at
  `;
  const params = [businessId, categoryId, unitId, name, sku, barcode, minStockLevel, defaultSupplierId];
  const result = await query(sql, params);
  return result.rows[0];
}

// current_stock BİLİNÇLİ olarak güncelleme dışında tutulur.
async function update(id, businessId, {
  categoryId,
  unitId,
  name,
  sku,
  barcode,
  minStockLevel,
  defaultSupplierId,
}) {
  const sql = `
    UPDATE products
    SET category_id = $1,
        unit_id = $2,
        name = $3,
        sku = $4,
        barcode = $5,
        min_stock_level = $6,
        default_supplier_id = $7,
        updated_at = now()
    WHERE id = $8 AND business_id = $9
    RETURNING id, business_id, category_id, unit_id, default_supplier_id, name, sku, barcode,
              current_stock, min_stock_level, is_active, created_at, updated_at
  `;
  const params = [categoryId, unitId, name, sku, barcode, minStockLevel, defaultSupplierId, id, businessId];
  const result = await query(sql, params);
  return result.rows[0] || null;
}

// Soft delete: kaydı silmez, is_active = false yapar.
async function softDelete(id, businessId) {
  const sql = `
    UPDATE products
    SET is_active = false, updated_at = now()
    WHERE id = $1 AND business_id = $2
    RETURNING id, business_id, name, is_active
  `;
  const result = await query(sql, [id, businessId]);
  return result.rows[0] || null;
}

module.exports = {
  findAllForBusiness,
  findById,
  existsByName,
  create,
  update,
  softDelete,
};
