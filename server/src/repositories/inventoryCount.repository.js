const { query, withTransaction } = require('../database/connection');
const { MOVEMENT_TYPES, DIRECTIONS } = require('../constants/movementTypes');

// Veritabanı erişimi. Tüm sorgular business_id ile filtrelenir (multi-tenant).

// Yeni sayım oturumu (DRAFT) açar ve o anki tüm AKTİF ürünleri sayım kalemi
// olarak snapshot'lar: expected_quantity = ürünün mevcut current_stock'u,
// counted_quantity = NULL (henüz sayılmadı). Atomik yapılır.
async function createWithSnapshot({ businessId, countedBy, note }) {
  return withTransaction(async (client) => {
    const countRes = await client.query(
      `INSERT INTO inventory_counts (business_id, counted_by, note, status)
       VALUES ($1, $2, $3, 'DRAFT')
       RETURNING id, business_id, counted_by, status, note,
                 started_at, completed_at, created_at, updated_at`,
      [businessId, countedBy, note]
    );
    const count = countRes.rows[0];

    // Aktif ürünleri sayım kalemlerine kopyala.
    await client.query(
      `INSERT INTO inventory_count_items (inventory_count_id, product_id, expected_quantity)
       SELECT $1, id, current_stock
       FROM products
       WHERE business_id = $2 AND is_active = true`,
      [count.id, businessId]
    );

    return count;
  });
}

// Sayım oturumlarını listeler (kimin yaptığı + kalem sayısı ile).
async function findAll(businessId) {
  const sql = `
    SELECT
      ic.id, ic.status, ic.note, ic.started_at, ic.completed_at,
      ic.created_at, ic.updated_at,
      us.full_name AS counted_by_name,
      (SELECT COUNT(*) FROM inventory_count_items i WHERE i.inventory_count_id = ic.id) AS item_count
    FROM inventory_counts ic
    JOIN users us ON us.id = ic.counted_by
    WHERE ic.business_id = $1
    ORDER BY ic.created_at DESC
  `;
  const result = await query(sql, [businessId]);
  return result.rows;
}

// Tek sayım başlığı - işletmeye ait olmalı.
async function findById(id, businessId) {
  const sql = `
    SELECT
      ic.id, ic.business_id, ic.counted_by, ic.status, ic.note,
      ic.started_at, ic.completed_at, ic.created_at, ic.updated_at,
      us.full_name AS counted_by_name
    FROM inventory_counts ic
    JOIN users us ON us.id = ic.counted_by
    WHERE ic.id = $1 AND ic.business_id = $2
    LIMIT 1
  `;
  const result = await query(sql, [id, businessId]);
  return result.rows[0] || null;
}

// Bir sayımın kalemleri (ürün adı, birim, beklenen/sayılan/fark).
async function findItems(countId) {
  const sql = `
    SELECT
      i.id, i.product_id, p.name AS product_name, u.short_name AS unit_short_name,
      i.expected_quantity, i.counted_quantity, i.difference_quantity, i.note
    FROM inventory_count_items i
    JOIN products p ON p.id = i.product_id
    JOIN units u ON u.id = p.unit_id
    WHERE i.inventory_count_id = $1
    ORDER BY p.name ASC
  `;
  const result = await query(sql, [countId]);
  return result.rows;
}

// Sayılan miktarları toplu günceller. Her giriş: { productId, countedQuantity, note }.
// Yalnızca bu sayıma ait kalemler güncellenir. Güncellenen kalem sayısını döner.
async function updateCountedQuantities(countId, items) {
  return withTransaction(async (client) => {
    let updated = 0;
    for (const item of items) {
      const res = await client.query(
        `UPDATE inventory_count_items
         SET counted_quantity = $1, note = $2, updated_at = now()
         WHERE inventory_count_id = $3 AND product_id = $4`,
        [item.countedQuantity, item.note, countId, item.productId]
      );
      updated += res.rowCount;
    }
    return updated;
  });
}

// Sayımı tamamlar: sayılan (counted_quantity NOT NULL) her kalem için, kayıtlı
// stok ile sayılan miktar farkı kadar COUNT_CORRECTION hareketi oluşturur ve
// ürünün current_stock'unu sayılan değere eşitler. Tümü tek transaction'da.
// Not: fark, tamamlama anındaki CANLI current_stock'a göre hesaplanır (arada
// başka hareket olduysa bile stok fiziksel sayıma doğru şekilde eşitlenir).
async function completeCount(countId, businessId, userId) {
  return withTransaction(async (client) => {
    // Sayım başlığını kilitle ve DRAFT olduğundan emin ol.
    const countRes = await client.query(
      `SELECT status FROM inventory_counts
       WHERE id = $1 AND business_id = $2
       FOR UPDATE`,
      [countId, businessId]
    );
    if (countRes.rowCount === 0) {
      return { ok: false, reason: 'NOT_FOUND' };
    }
    if (countRes.rows[0].status !== 'DRAFT') {
      return { ok: false, reason: 'NOT_DRAFT' };
    }

    // Sayılmış kalemler.
    const itemsRes = await client.query(
      `SELECT product_id, counted_quantity
       FROM inventory_count_items
       WHERE inventory_count_id = $1 AND counted_quantity IS NOT NULL`,
      [countId]
    );

    let corrections = 0;
    for (const item of itemsRes.rows) {
      // Ürünü kilitle, canlı stoğu al.
      const prodRes = await client.query(
        `SELECT current_stock FROM products
         WHERE id = $1 AND business_id = $2
         FOR UPDATE`,
        [item.product_id, businessId]
      );
      if (prodRes.rowCount === 0) continue; // ürün silinmişse atla

      const currentStock = Number(prodRes.rows[0].current_stock);
      const counted = Number(item.counted_quantity);
      const delta = counted - currentStock;

      if (delta !== 0) {
        const direction = delta > 0 ? DIRECTIONS.IN : DIRECTIONS.OUT;
        await client.query(
          `INSERT INTO stock_movements
             (business_id, product_id, user_id, movement_type, direction, quantity, note)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            businessId, item.product_id, userId,
            MOVEMENT_TYPES.COUNT_CORRECTION, direction, Math.abs(delta),
            'Sayım düzeltmesi',
          ]
        );
        await client.query(
          `UPDATE products SET current_stock = $1, updated_at = now()
           WHERE id = $2 AND business_id = $3`,
          [counted, item.product_id, businessId]
        );
        corrections += 1;
      }
    }

    await client.query(
      `UPDATE inventory_counts
       SET status = 'COMPLETED', completed_at = now(), updated_at = now()
       WHERE id = $1 AND business_id = $2`,
      [countId, businessId]
    );

    return { ok: true, corrections, countedItems: itemsRes.rowCount };
  });
}

// Sayımı iptal eder (yalnızca DRAFT ise). Stok değişmez.
async function cancelCount(countId, businessId) {
  const sql = `
    UPDATE inventory_counts
    SET status = 'CANCELLED', updated_at = now()
    WHERE id = $1 AND business_id = $2 AND status = 'DRAFT'
    RETURNING id, status
  `;
  const result = await query(sql, [countId, businessId]);
  return result.rows[0] || null;
}

module.exports = {
  createWithSnapshot,
  findAll,
  findById,
  findItems,
  updateCountedQuantities,
  completeCount,
  cancelCount,
};
