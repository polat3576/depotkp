const reportRepository = require('../repositories/report.repository');
const { resolveRange } = require('../validations/report.validation');

// Tüm raporlar business_id ile sınırlıdır (multi-tenant).

// Tüketim raporu (haftalık/aylık). from/to veya period ile aralık belirlenir.
async function getConsumption(businessId, queryParams) {
  const range = resolveRange(queryParams);
  const items = await reportRepository.consumptionByProduct(businessId, range.from, range.to);
  return { range, items };
}

// Alım (satın alma) raporu.
async function getPurchases(businessId, queryParams) {
  const range = resolveRange(queryParams);
  const items = await reportRepository.purchasesByProduct(businessId, range.from, range.to);
  return { range, items };
}

// Kritik stok raporu (tarih aralığı gerektirmez).
async function getLowStock(businessId) {
  const items = await reportRepository.lowStock(businessId);
  return { items };
}

module.exports = {
  getConsumption,
  getPurchases,
  getLowStock,
};
