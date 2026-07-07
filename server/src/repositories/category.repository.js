const { query } = require('../database/connection');

// Sadece veritabanı erişimi. Tüm sorgular business_id ile filtrelenir (multi-tenant).

// İşletmenin kategorileri. Varsayılan olarak sadece aktif olanlar döner.
async function findAllForBusiness(businessId, { includeInactive = false } = {}) {
  const sql = `
    SELECT id, business_id, name, description, is_active, created_at, updated_at
    FROM product_categories
    WHERE business_id = $1
      AND ($2 = true OR is_active = true)
    ORDER BY name ASC
  `;
  const result = await query(sql, [businessId, includeInactive]);
  return result.rows;
}

// Tek kategori (aktif/pasif fark etmez) - işletmeye ait olmalı.
async function findById(id, businessId) {
  const sql = `
    SELECT id, business_id, name, description, is_active, created_at, updated_at
    FROM product_categories
    WHERE id = $1 AND business_id = $2
    LIMIT 1
  `;
  const result = await query(sql, [id, businessId]);
  return result.rows[0] || null;
}

// Aynı işletmede aynı isim var mı? (isteğe bağlı bir kaydı hariç tutar - update için)
async function existsByName(businessId, name, excludeId = null) {
  const sql = `
    SELECT 1 FROM product_categories
    WHERE business_id = $1 AND LOWER(name) = LOWER($2)
      AND ($3::uuid IS NULL OR id <> $3)
    LIMIT 1
  `;
  const result = await query(sql, [businessId, name, excludeId]);
  return result.rowCount > 0;
}

async function create({ businessId, name, description }) {
  const sql = `
    INSERT INTO product_categories (business_id, name, description)
    VALUES ($1, $2, $3)
    RETURNING id, business_id, name, description, is_active, created_at, updated_at
  `;
  const result = await query(sql, [businessId, name, description]);
  return result.rows[0];
}

async function update(id, businessId, { name, description }) {
  const sql = `
    UPDATE product_categories
    SET name = $1, description = $2, updated_at = now()
    WHERE id = $3 AND business_id = $4
    RETURNING id, business_id, name, description, is_active, created_at, updated_at
  `;
  const result = await query(sql, [name, description, id, businessId]);
  return result.rows[0] || null;
}

// Soft delete: kaydı silmez, is_active = false yapar.
async function softDelete(id, businessId) {
  const sql = `
    UPDATE product_categories
    SET is_active = false, updated_at = now()
    WHERE id = $1 AND business_id = $2
    RETURNING id, business_id, name, description, is_active, created_at, updated_at
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
