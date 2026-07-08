const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/response');
const stockService = require('../services/stockMovement.service');
const { validateCreateMovement } = require('../validations/stock.validation');
const { stripPriceFieldsForStaff } = require('../utils/priceVisibility');

// POST /api/stock/movements
// Rol kuralı serviste uygulanır: staff yalnızca OUT, admin tümü.
const create = asyncHandler(async (req, res) => {
  const data = validateCreateMovement(req.body);
  const result = await stockService.createMovement(
    { businessId: req.user.business_id, userId: req.user.id, role: req.user.role },
    data
  );
  return successResponse(res, result, 'Stok hareketi kaydedildi', 201);
});

// GET /api/stock/products/:productId/movements  (admin + staff)
// STAFF için unit_cost gibi fiyat/maliyet alanları response'tan çıkarılır.
const listByProduct = asyncHandler(async (req, res) => {
  const movements = await stockService.getProductMovements(
    req.user.business_id,
    req.params.productId
  );
  const safeMovements = stripPriceFieldsForStaff(movements, req.user.role);
  return successResponse(res, safeMovements, 'Ürün stok hareketleri');
});

// GET /api/stock/products/:productId/purchase-history  (admin only - fiyat bilgisi)
const purchaseHistory = asyncHandler(async (req, res) => {
  const history = await stockService.getPurchaseHistory(
    req.user.business_id,
    req.params.productId
  );
  return successResponse(res, history, 'Ürün alım geçmişi');
});

module.exports = {
  create,
  listByProduct,
  purchaseHistory,
};
