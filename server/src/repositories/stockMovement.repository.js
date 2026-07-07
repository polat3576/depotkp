const { query, withTransaction } = require('../database/connection');

// Veritabanı erişimi. Tüm sorgular business_id ile filtrelenir (multi-tenant).

// Bir stok hareketi ekler VE ürünün current_stock'unu atomik olarak günceller.
// Yarış durumlarına karşı ürün satırı FOR UPDATE ile kilitlenir.
//
// signedDelta: stoğa uygulanacak işaretli değişim (+giriş / -çıkış).
// Dönüş, HTTP bilgisi içermez; servis katmanı "reason" değerini çevirir:
//   { ok: false, reason: 'PRODUCT_NOT_FOUND' }
//   { ok: false, reason: 'INSUFFICIENT_STOCK', currentStock }
//   { ok: true, movement, newStock }
async function createWithStockUpdate(data) {
  const {
    businessId, productId, userId, movementType, direction,
    quantity, unitCost, supplierId, documentNo, note, occurredAt, signedDelta,
  } = data;

  return withTransaction(async (client) => {
    // Ürünü kilitle (aynı anda başka bir hareket stoğu bozmasın).
    const productRes = await client.query(
      `SELECT current_stock FROM products
       WHERE id = $1 AND business_id = $2 AND is_active = true
       FOR UPDATE`,
      [productId, businessId]
    );

    if (productRes.rowCount === 0) {
      return { ok: false, reason: 'PRODUCT_NOT_FOUND' };
    }

    const currentStock = Number(productRes.rows[0].current_stock);
    const newStock = currentStock + signedDelta;

    if (newStock < 0) {
      return { ok: false, reason: 'INSUFFICIENT_STOCK', currentStock };
    }

    const insertRes = await client.query(
      `INSERT INTO stock_movements
         (business_id, product_id, user_id, movement_type, direction,
          quantity, unit_cost, supplier_id, document_no, note, occurred_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE($11, now()))
       RETURNING id, business_id, product_id, user_id, movement_type, direction,
                 quantity, unit_cost, supplier_id, document_no, note,
                 occurred_at, created_at`,
      [
        businessId, productId, userId, movementType, direction,
        quantity, unitCost, supplierId, documentNo, note, occurredAt,
      ]
    );

    await client.query(
      `UPDATE products SET current_stock = $1, updated_at = now()
       WHERE id = $2 AND business_id = $3`,
      [newStock, productId, businessId]
    );

    return { ok: true, movement: insertRes.rows[0], newStock };
  });
}

// Bir ürünün tüm hareket geçmişi (tür fark etmeksizin), en yeni önce.
async function findByProduct(productId, businessId, { limit = 100 } = {}) {
  const sql = `
    SELECT
      sm.id, sm.movement_type, sm.direction, sm.quantity,
      sm.unit_cost, sm.document_no, sm.note,
      sm.occurred_at, sm.created_at,
      s.name AS supplier_name,
      us.full_name AS created_by
    FROM stock_movements sm
    LEFT JOIN suppliers s ON s.id = sm.supplier_id
    JOIN users us ON us.id = sm.user_id
    WHERE sm.product_id = $1 AND sm.business_id = $2
    ORDER BY sm.occurred_at DESC, sm.created_at DESC
    LIMIT $3
  `;
  const result = await query(sql, [productId, businessId, limit]);
  return result.rows;
}

// Bir ürünün ALIM geçmişi (yalnızca IN hareketleri): tarih, fiyat, tutar,
// tedarikçi, belge no, giren kullanıcı. Fiyat değişimini görmek için.
async function findPurchaseHistory(productId, businessId) {
  const sql = `
    SELECT
      sm.id,
      sm.quantity,
      sm.unit_cost,
      (sm.quantity * sm.unit_cost) AS total_cost,
      sm.occurred_at,
      sm.document_no,
      s.name AS supplier_name,
      us.full_name AS created_by
    FROM stock_movements sm
    LEFT JOIN suppliers s ON s.id = sm.supplier_id
    JOIN users us ON us.id = sm.user_id
    WHERE sm.product_id = $1
      AND sm.business_id = $2
      AND sm.movement_type = 'IN'
    ORDER BY sm.occurred_at DESC
  `;
  const result = await query(sql, [productId, businessId]);
  return result.rows;
}

module.exports = {
  createWithStockUpdate,
  findByProduct,
  findPurchaseHistory,
};
