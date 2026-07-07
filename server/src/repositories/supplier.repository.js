const { query } = require('../database/connection');

// Veritabanı erişimi. Tüm sorgular business_id ile filtrelenir (multi-tenant).

// İşletmenin tedarikçileri. Varsayılan olarak sadece aktif olanlar döner.
async function findAllForBusiness(businessId, { includeInactive = false } = {}) {
  const sql = `
    SELECT id, business_id, name, phone, email, address, note, is_active,
           created_at, updated_at
    FROM suppliers
    WHERE business_id = $1
      AND ($2 = true OR is_active = true)
    ORDER BY name ASC
  `;
  const result = await query(sql, [businessId, includeInactive]);
  return result.rows;
}

// Tek tedarikçi (aktif/pasif fark etmez) - işletmeye ait olmalı.
// Stok girişinde supplier_id doğrulaması için de kullanılır.
async function findById(id, businessId) {
  const sql = `
    SELECT id, business_id, name, phone, email, address, note, is_active,
           created_at, updated_at
    FROM suppliers
    WHERE id = $1 AND business_id = $2
    LIMIT 1
  `;
  const result = await query(sql, [id, businessId]);
  return result.rows[0] || null;
}

// Aynı işletmede aynı isim var mı? (update için bir kaydı hariç tutabilir)
async function existsByName(businessId, name, excludeId = null) {
  const sql = `
    SELECT 1 FROM suppliers
    WHERE business_id = $1 AND LOWER(name) = LOWER($2)
      AND ($3::uuid IS NULL OR id <> $3)
    LIMIT 1
  `;
  const result = await query(sql, [businessId, name, excludeId]);
  return result.rowCount > 0;
}

async function create({ businessId, name, phone, email, address, note }) {
  const sql = `
    INSERT INTO suppliers (business_id, name, phone, email, address, note)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, business_id, name, phone, email, address, note, is_active,
              created_at, updated_at
  `;
  const result = await query(sql, [businessId, name, phone, email, address, note]);
  return result.rows[0];
}

async function update(id, businessId, { name, phone, email, address, note }) {
  const sql = `
    UPDATE suppliers
    SET name = $1, phone = $2, email = $3, address = $4, note = $5, updated_at = now()
    WHERE id = $6 AND business_id = $7
    RETURNING id, business_id, name, phone, email, address, note, is_active,
              created_at, updated_at
  `;
  const result = await query(sql, [name, phone, email, address, note, id, businessId]);
  return result.rows[0] || null;
}

// Soft delete: kaydı silmez, is_active = false yapar.
async function softDelete(id, businessId) {
  const sql = `
    UPDATE suppliers
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
