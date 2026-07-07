const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/response');
const productService = require('../services/product.service');
const {
  validateCreateProduct,
  validateUpdateProduct,
} = require('../validations/product.validation');

// GET /api/products  (admin + staff)
const list = asyncHandler(async (req, res) => {
  const includeInactive = req.query.includeInactive === 'true';
  const products = await productService.listProducts(req.user.business_id, { includeInactive });
  return successResponse(res, products, 'Ürünler listelendi');
});

// GET /api/products/:id  (admin + staff)
const getOne = asyncHandler(async (req, res) => {
  const product = await productService.getProduct(req.user.business_id, req.params.id);
  return successResponse(res, product, 'Ürün detayı');
});

// POST /api/products  (admin only)
const create = asyncHandler(async (req, res) => {
  const data = validateCreateProduct(req.body);
  const product = await productService.createProduct(req.user.business_id, data);
  return successResponse(res, product, 'Ürün oluşturuldu', 201);
});

// PUT /api/products/:id  (admin only)
const update = asyncHandler(async (req, res) => {
  const data = validateUpdateProduct(req.body);
  const product = await productService.updateProduct(req.user.business_id, req.params.id, data);
  return successResponse(res, product, 'Ürün güncellendi');
});

// DELETE /api/products/:id  (admin only, soft delete)
const remove = asyncHandler(async (req, res) => {
  const product = await productService.deleteProduct(req.user.business_id, req.params.id);
  return successResponse(res, product, 'Ürün pasife alındı');
});

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
};
