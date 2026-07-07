const { query } = require('../database/connection');

// Sadece veritabanı erişimi. İş kuralı yok.

// İşletmenin erişebildiği birimler: global (business_id IS NULL) + kendi özel birimleri.
async function findAllForBusiness(businessId) {
  const sql = `
    SELECT id, business_id, name, short_name, created_at, updated_at
    FROM units
    WHERE business_id IS NULL OR business_id = $1
    ORDER BY name ASC
  `;
  const result = await query(sql, [businessId]);
  return result.rows;
}

// Bir birim bu işletme için geçerli mi? (global veya işletmeye ait)
// Ürün oluştururken unit_id doğrulaması için kullanılır.
async function findAccessibleById(id, businessId) {
  const sql = `
    SELECT id, business_id, name, short_name
    FROM units
    WHERE id = $1 AND (business_id IS NULL OR business_id = $2)
    LIMIT 1
  `;
  const result = await query(sql, [id, businessId]);
  return result.rows[0] || null;
}

module.exports = {
  findAllForBusiness,
  findAccessibleById,
};
