const reportRepository = require('../repositories/report.repository');
const { resolveRange } = require('../validations/report.validation');

// Tüm raporlar business_id ile sınırlıdır (multi-tenant).

// Tüketim raporu (haftalık/aylık). from/to veya period ile aralık belirlenir.
async function getConsumption(businessId, queryParams) {
  const range = resolveRange(queryParams);
  const items = await reportRepository.consumptionByProduct(businessId, range.from, range.to);
  return { range, items };
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Bir alım satırını, "ne kadar idare etmiş" bilgisiyle zenginleştirir.
// consumed_quantity: bu alımdan sonraki alıma (ya da bugüne) kadarki ÇIKIŞ toplamı.
// remaining_quantity: alınan miktardan tüketilenin düşülmesiyle kalan tahmini (negatife inmez).
// is_active: bu, ürünün henüz bir sonraki alımı yapılmamış (hâlâ "güncel") partisi mi.
// days_covered: bu partinin "aktif" kaldığı gün sayısı (alım tarihinden sonraki alıma/bugüne kadar).
function enrichPurchaseRow(row) {
  const quantity = Number(row.quantity);
  const consumedQuantity = Number(row.consumed_quantity);
  const purchaseDate = new Date(row.purchase_date);
  const isActive = row.next_purchase_at == null;
  const periodEnd = isActive ? new Date() : new Date(row.next_purchase_at);
  const daysCovered = Math.max(0, Math.round((periodEnd.getTime() - purchaseDate.getTime()) / DAY_MS));

  return {
    ...row,
    consumed_quantity: consumedQuantity,
    remaining_quantity: Math.max(quantity - consumedQuantity, 0),
    is_active: isActive,
    days_covered: daysCovered,
  };
}

// Alım (satın alma) detay raporu: her alım hareketi ayrı satır, fiyat +
// "ne kadar idare etmiş" bilgisiyle birlikte.
async function getPurchases(businessId, queryParams) {
  const range = resolveRange(queryParams);
  const rows = await reportRepository.purchaseDetail(businessId, range.from, range.to);
  const items = rows.map(enrichPurchaseRow);
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
