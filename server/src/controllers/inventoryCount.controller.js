const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/response');
const inventoryService = require('../services/inventoryCount.service');
const {
  validateCreateCount,
  validateUpdateItems,
} = require('../validations/inventory.validation');

// POST /api/inventory-counts  (admin + staff)
const create = asyncHandler(async (req, res) => {
  const data = validateCreateCount(req.body);
  const count = await inventoryService.createCount(req.user.business_id, req.user.id, data);
  return successResponse(res, count, 'Sayım oluşturuldu', 201);
});

// GET /api/inventory-counts  (admin + staff)
const list = asyncHandler(async (req, res) => {
  const counts = await inventoryService.listCounts(req.user.business_id);
  return successResponse(res, counts, 'Sayımlar listelendi');
});

// GET /api/inventory-counts/:id  (admin + staff)
const getOne = asyncHandler(async (req, res) => {
  const count = await inventoryService.getCount(req.user.business_id, req.params.id);
  return successResponse(res, count, 'Sayım detayı');
});

// PUT /api/inventory-counts/:id/items  (admin + staff)
const updateItems = asyncHandler(async (req, res) => {
  const { items } = validateUpdateItems(req.body);
  const count = await inventoryService.updateItems(req.user.business_id, req.params.id, items);
  return successResponse(res, count, 'Sayım kalemleri güncellendi');
});

// POST /api/inventory-counts/:id/complete  (admin only)
const complete = asyncHandler(async (req, res) => {
  const result = await inventoryService.completeCount(
    req.user.business_id,
    req.user.id,
    req.params.id
  );
  return successResponse(res, result, 'Sayım tamamlandı');
});

// POST /api/inventory-counts/:id/cancel  (admin only)
const cancel = asyncHandler(async (req, res) => {
  const result = await inventoryService.cancelCount(req.user.business_id, req.params.id);
  return successResponse(res, result, 'Sayım iptal edildi');
});

module.exports = {
  create,
  list,
  getOne,
  updateItems,
  complete,
  cancel,
};
