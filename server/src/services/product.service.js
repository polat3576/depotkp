const AppError = require('../utils/AppError');
const productRepository = require('../repositories/product.repository');
const categoryRepository = require('../repositories/category.repository');
const unitRepository = require('../repositories/unit.repository');
const supplierRepository = require('../repositories/supplier.repository');

// Tüm işlemler business_id ile sınırlıdır (multi-tenant).

// category_id ve unit_id'nin bu işletme için geçerli olduğunu doğrular.
async function assertCategoryAndUnitValid(businessId, categoryId, unitId) {
  const category = await categoryRepository.findById(categoryId, businessId);
  if (!category || !category.is_active) {
    throw new AppError('Geçersiz kategori', 422);
  }

  // Birim global (business_id IS NULL) veya işletmeye ait olabilir.
  const unit = await unitRepository.findAccessibleById(unitId, businessId);
  if (!unit) {
    throw new AppError('Geçersiz birim', 422);
  }
}

// default_supplier_id opsiyonel; verilirse bu işletmeye ait olmalı.
async function assertSupplierValid(businessId, supplierId) {
  if (!supplierId) return;
  const supplier = await supplierRepository.findById(supplierId, businessId);
  if (!supplier) {
    throw new AppError('Geçersiz tedarikçi', 422);
  }
}

async function listProducts(businessId, { includeInactive = false } = {}) {
  return productRepository.findAllForBusiness(businessId, { includeInactive });
}

async function getProduct(businessId, id) {
  const product = await productRepository.findById(id, businessId);
  if (!product) {
    throw new AppError('Ürün bulunamadı', 404);
  }
  return product;
}

async function createProduct(businessId, data) {
  const { name, categoryId, unitId, sku, barcode, minStockLevel, defaultSupplierId } = data;

  const nameTaken = await productRepository.existsByName(businessId, name);
  if (nameTaken) {
    throw new AppError('Bu isimde bir ürün zaten var', 409);
  }

  await assertCategoryAndUnitValid(businessId, categoryId, unitId);
  await assertSupplierValid(businessId, defaultSupplierId);

  // current_stock gönderilmez -> tabloda DEFAULT 0 ile başlar.
  return productRepository.create({
    businessId,
    categoryId,
    unitId,
    name,
    sku,
    barcode,
    minStockLevel,
    defaultSupplierId,
  });
}

async function updateProduct(businessId, id, data) {
  const { name, categoryId, unitId, sku, barcode, minStockLevel, defaultSupplierId } = data;

  const existing = await productRepository.findById(id, businessId);
  if (!existing) {
    throw new AppError('Ürün bulunamadı', 404);
  }

  const nameTaken = await productRepository.existsByName(businessId, name, id);
  if (nameTaken) {
    throw new AppError('Bu isimde bir ürün zaten var', 409);
  }

  await assertCategoryAndUnitValid(businessId, categoryId, unitId);
  await assertSupplierValid(businessId, defaultSupplierId);

  // current_stock güncellenmez -> stok yalnızca stok hareketi modülünce değişir.
  return productRepository.update(id, businessId, {
    categoryId,
    unitId,
    name,
    sku,
    barcode,
    minStockLevel,
    defaultSupplierId,
  });
}

async function deleteProduct(businessId, id) {
  const existing = await productRepository.findById(id, businessId);
  if (!existing) {
    throw new AppError('Ürün bulunamadı', 404);
  }
  // Soft delete: kayıt silinmez, is_active = false yapılır.
  return productRepository.softDelete(id, businessId);
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
