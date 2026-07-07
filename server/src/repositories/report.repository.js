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

// Alım raporu: verilen tarih aralığında ürün bazında toplam GİRİŞ (IN)
// miktarı ve toplam maliyeti.
async function purchasesByProduct(businessId, fromIso, toIso) {
  const sql = `
    SELECT
      p.id AS product_id,
      p.name AS product_name,
      u.short_name AS unit,
      SUM(sm.quantity) AS total_quantity,
      SUM(sm.quantity * sm.unit_cost) AS total_cost,
      COUNT(*) AS movement_count
    FROM stock_movements sm
    JOIN products p ON p.id = sm.product_id
    JOIN units u ON u.id = p.unit_id
    WHERE sm.business_id = $1
      AND sm.movement_type = 'IN'
      AND sm.occurred_at >= $2
      AND sm.occurred_at <= $3
    GROUP BY p.id, p.name, u.short_name
    ORDER BY total_cost DESC
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
  purchasesByProduct,
  lowStock,
};
