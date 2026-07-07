const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/response');
const stockService = require('../services/stockMovement.service');
const { validateCreateMovement } = require('../validations/stock.validation');

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
const listByProduct = asyncHandler(async (req, res) => {
  const movements = await stockService.getProductMovements(
    req.user.business_id,
    req.params.productId
  );
  return successResponse(res, movements, 'Ürün stok hareketleri');
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
