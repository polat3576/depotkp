const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/response');
const supplierService = require('../services/supplier.service');
const {
  validateCreateSupplier,
  validateUpdateSupplier,
} = require('../validations/supplier.validation');

// GET /api/suppliers  (admin + staff)
const list = asyncHandler(async (req, res) => {
  const includeInactive = req.query.includeInactive === 'true';
  const suppliers = await supplierService.listSuppliers(req.user.business_id, { includeInactive });
  return successResponse(res, suppliers, 'Tedarikçiler listelendi');
});

// GET /api/suppliers/:id  (admin + staff)
const getOne = asyncHandler(async (req, res) => {
  const supplier = await supplierService.getSupplier(req.user.business_id, req.params.id);
  return successResponse(res, supplier, 'Tedarikçi detayı');
});

// POST /api/suppliers  (admin only)
const create = asyncHandler(async (req, res) => {
  const data = validateCreateSupplier(req.body);
  const supplier = await supplierService.createSupplier(req.user.business_id, data);
  return successResponse(res, supplier, 'Tedarikçi oluşturuldu', 201);
});

// PUT /api/suppliers/:id  (admin only)
const update = asyncHandler(async (req, res) => {
  const data = validateUpdateSupplier(req.body);
  const supplier = await supplierService.updateSupplier(req.user.business_id, req.params.id, data);
  return successResponse(res, supplier, 'Tedarikçi güncellendi');
});

// DELETE /api/suppliers/:id  (admin only, soft delete)
const remove = asyncHandler(async (req, res) => {
  const supplier = await supplierService.deleteSupplier(req.user.business_id, req.params.id);
  return successResponse(res, supplier, 'Tedarikçi pasife alındı');
});

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
};
