const dashboardRepository = require('../repositories/dashboard.repository');

// Sayısal alanları frontend'de doğrudan kullanılabilir hale getirir.
// (pg, NUMERIC/SUM sonuçlarını string döndürebilir.)
function toNumber(value) {
  return value == null ? 0 : Number(value);
}

// Son hareketleri frontend'e uygun camelCase formata çevirir (maliyet yok).
function mapMovement(row) {
  return {
    id: row.id,
    productName: row.product_name,
    movementType: row.movement_type,
    quantity: toNumber(row.quantity),
    unit: row.unit,
    userName: row.user_name,
    supplierName: row.supplier_name, // nullable
    occurredAt: row.occurred_at,
    note: row.note, // nullable
  };
}

function mapLowStockProduct(row) {
  return {
    id: row.id,
    productName: row.product_name,
    currentStock: toNumber(row.current_stock),
    minStockLevel: toNumber(row.min_stock_level),
    unit: row.unit,
    category: row.category,
  };
}

// Dashboard özetini tek seferde toplar. Sorgular paralel çalışır (hızlı).
async function getSummary(businessId) {
  const [
    totalProducts,
    lowStockProductsCount,
    todayStats,
    recent,
    lowStock,
  ] = await Promise.all([
    dashboardRepository.countActiveProducts(businessId),
    dashboardRepository.countLowStock(businessId),
    dashboardRepository.todayMovementStats(businessId),
    dashboardRepository.recentMovements(businessId, 10),
    dashboardRepository.lowestStockProducts(businessId, 5),
  ]);

  return {
    totalProducts,
    lowStockProductsCount,
    todayInCount: toNumber(todayStats.today_in_count),
    todayOutCount: toNumber(todayStats.today_out_count),
    todayOutQuantityTotal: toNumber(todayStats.today_out_quantity_total),
    recentMovements: recent.map(mapMovement),
    lowStockProducts: lowStock.map(mapLowStockProduct),
  };
}

module.exports = {
  getSummary,
};
