const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/response');
const categoryService = require('../services/category.service');
const {
  validateCreateCategory,
  validateUpdateCategory,
} = require('../validations/category.validation');

// GET /api/categories  (admin + staff)
const list = asyncHandler(async (req, res) => {
  const includeInactive = req.query.includeInactive === 'true';
  const categories = await categoryService.listCategories(req.user.business_id, { includeInactive });
  return successResponse(res, categories, 'Kategoriler listelendi');
});

// POST /api/categories  (admin only)
const create = asyncHandler(async (req, res) => {
  const data = validateCreateCategory(req.body);
  const category = await categoryService.createCategory(req.user.business_id, data);
  return successResponse(res, category, 'Kategori oluşturuldu', 201);
});

// PUT /api/categories/:id  (admin only)
const update = asyncHandler(async (req, res) => {
  const data = validateUpdateCategory(req.body);
  const category = await categoryService.updateCategory(req.user.business_id, req.params.id, data);
  return successResponse(res, category, 'Kategori güncellendi');
});

// DELETE /api/categories/:id  (admin only, soft delete)
const remove = asyncHandler(async (req, res) => {
  const category = await categoryService.deleteCategory(req.user.business_id, req.params.id);
  return successResponse(res, category, 'Kategori pasife alındı');
});

module.exports = {
  list,
  create,
  update,
  remove,
};
