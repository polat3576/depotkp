const { query } = require('../database/connection');

// Dashboard için hafif, hızlı sorgular. Tümü business_id ile filtrelenir.
// NOT: Hiçbir sorguda unit_cost / maliyet bilgisi SELECT edilmez
// (dashboard'ı staff da görebildiği için maliyet dışarı çıkmamalı).

// Aktif ürün sayısı.
async function countActiveProducts(businessId) {
  const result = await query(
    `SELECT COUNT(*)::int AS count
     FROM products
     WHERE business_id = $1 AND is_active = true`,
    [businessId]
  );
  return result.rows[0].count;
}

// Stoğu minimum seviyesinde ya da altında olan aktif ürün sayısı.
async function countLowStock(businessId) {
  const result = await query(
    `SELECT COUNT(*)::int AS count
     FROM products
     WHERE business_id = $1 AND is_active = true
       AND current_stock <= min_stock_level`,
    [businessId]
  );
  return result.rows[0].count;
}

// Bugünkü IN/OUT hareket sayıları ve toplam çıkış miktarı (tek sorguda).
// "Bugün" = veritabanı gününün başlangıcından (CURRENT_DATE) itibaren.
async function todayMovementStats(businessId) {
  const result = await query(
    `SELECT
       COUNT(*) FILTER (WHERE movement_type = 'IN')::int  AS today_in_count,
       COUNT(*) FILTER (WHERE movement_type = 'OUT')::int AS today_out_count,
       COALESCE(SUM(quantity) FILTER (WHERE movement_type = 'OUT'), 0) AS today_out_quantity_total
     FROM stock_movements
     WHERE business_id = $1 AND occurred_at >= CURRENT_DATE`,
    [businessId]
  );
  return result.rows[0];
}

// Son N stok hareketi (maliyet HARİÇ).
async function recentMovements(businessId, limit = 10) {
  const result = await query(
    `SELECT
       sm.id,
       p.name         AS product_name,
       sm.movement_type,
       sm.quantity,
       u.short_name   AS unit,
       us.full_name   AS user_name,
       s.name         AS supplier_name,
       sm.occurred_at,
       sm.note
     FROM stock_movements sm
     JOIN products p ON p.id = sm.product_id
     JOIN units u ON u.id = p.unit_id
     JOIN users us ON us.id = sm.user_id
     LEFT JOIN suppliers s ON s.id = sm.supplier_id
     WHERE sm.business_id = $1
     ORDER BY sm.occurred_at DESC, sm.created_at DESC
     LIMIT $2`,
    [businessId, limit]
  );
  return result.rows;
}

// En düşük stoktaki N aktif ürün.
async function lowestStockProducts(businessId, limit = 5) {
  const result = await query(
    `SELECT
       p.id,
       p.name           AS product_name,
       p.current_stock,
       p.min_stock_level,
       u.short_name     AS unit,
       c.name           AS category
     FROM products p
     JOIN units u ON u.id = p.unit_id
     JOIN product_categories c ON c.id = p.category_id
     WHERE p.business_id = $1 AND p.is_active = true
     ORDER BY p.current_stock ASC, p.name ASC
     LIMIT $2`,
    [businessId, limit]
  );
  return result.rows;
}

module.exports = {
  countActiveProducts,
  countLowStock,
  todayMovementStats,
  recentMovements,
  lowestStockProducts,
};
