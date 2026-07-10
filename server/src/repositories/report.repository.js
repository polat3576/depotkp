const { query } = require('../database/connection');

// Raporlama sorguları. Tümü business_id ile filtrelenir (multi-tenant).

// Tüketim raporu: verilen tarih aralığında ürün bazında toplam ÇIKIŞ (OUT).
// "Tüketim" = depodan kullanım için çıkılan miktar. Sayım farkı/fire
// (COUNT_CORRECTION / ADJUSTMENT) buraya dahil edilmez; onlar ayrı kalemlerdir.
async function consumptionByProduct(businessId, fromIso, toIso) {
  const sql = `
    SELECT
      p.id AS product_id,
      p.name AS product_name,
      u.short_name AS unit,
      SUM(sm.quantity) AS total_quantity,
      COUNT(*) AS movement_count
    FROM stock_movements sm
    JOIN products p ON p.id = sm.product_id
    JOIN units u ON u.id = p.unit_id
    WHERE sm.business_id = $1
      AND sm.movement_type = 'OUT'
      AND sm.occurred_at >= $2
      AND sm.occurred_at <= $3
    GROUP BY p.id, p.name, u.short_name
    ORDER BY total_quantity DESC
  `;
  const result = await query(sql, [businessId, fromIso, toIso]);
  return result.rows;
}

// Alım detay raporu: verilen tarih aralığındaki her tek alım (IN) hareketi
// ayrı satır olarak döner (tarih, birim fiyat, miktar, tedarikçi). Ayrıca
// her satır için "next_purchase_at" hesaplanır: aynı ürünün bir SONRAKİ
// alımının tarihi (yoksa NULL -> bu, ürünün hâlâ aktif/son partisi).
// "consumed_quantity", bu alım tarihinden sonraki alıma kadar (ya da son
// alımsa bugüne kadar) yapılan ÇIKIŞ (OUT) toplamıdır -> "bu alım ne kadar
// idare etmiş" sorusuna yaklaşık bir cevaptır. Parti/lot takibi olmadığı
// için kesin FIFO eşleştirmesi değil, zaman aralığına dayalı bir tahmindir.
async function purchaseDetail(businessId, fromIso, toIso) {
  const sql = `
    WITH purchases AS (
      SELECT
        sm.id, sm.product_id, sm.quantity, sm.unit_cost,
        sm.occurred_at, sm.document_no, sm.supplier_id,
        LEAD(sm.occurred_at) OVER (
          PARTITION BY sm.product_id ORDER BY sm.occurred_at, sm.id
        ) AS next_purchase_at
      FROM stock_movements sm
      WHERE sm.business_id = $1 AND sm.movement_type = 'IN'
    )
    SELECT
      p.id AS movement_id,
      pr.id AS product_id,
      pr.name AS product_name,
      u.short_name AS unit,
      p.occurred_at AS purchase_date,
      p.quantity,
      p.unit_cost,
      (p.quantity * p.unit_cost) AS total_cost,
      p.document_no,
      s.name AS supplier_name,
      p.next_purchase_at,
      COALESCE((
        SELECT SUM(o.quantity)
        FROM stock_movements o
        WHERE o.business_id = $1
          AND o.product_id = p.product_id
          AND o.movement_type = 'OUT'
          AND o.occurred_at >= p.occurred_at
          AND (p.next_purchase_at IS NULL OR o.occurred_at < p.next_purchase_at)
      ), 0) AS consumed_quantity
    FROM purchases p
    JOIN products pr ON pr.id = p.product_id
    JOIN units u ON u.id = pr.unit_id
    LEFT JOIN suppliers s ON s.id = p.supplier_id
    WHERE p.occurred_at >= $2 AND p.occurred_at <= $3
    ORDER BY p.occurred_at DESC
  `;
  const result = await query(sql, [businessId, fromIso, toIso]);
  return result.rows;
}

// Kritik stok raporu: mevcut stoğu minimum seviyesinde ya da altında olan
// aktif ürünler. En kritik (en çok eksik) olan başta.
async function lowStock(businessId) {
  const sql = `
    SELECT
      p.id AS product_id,
      p.name AS product_name,
      u.short_name AS unit,
      p.current_stock,
      p.min_stock_level
    FROM products p
    JOIN units u ON u.id = p.unit_id
    WHERE p.business_id = $1
      AND p.is_active = true
      AND p.min_stock_level > 0
      AND p.current_stock <= p.min_stock_level
    ORDER BY (p.min_stock_level - p.current_stock) DESC
  `;
  const result = await query(sql, [businessId]);
  return result.rows;
}

module.exports = {
  consumptionByProduct,
  purchaseDetail,
  lowStock,
};
