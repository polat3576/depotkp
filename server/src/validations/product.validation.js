const AppError = require('../utils/AppError');

// Hafif elle doğrulama (MVP). Hatalıysa AppError fırlatır, temiz veri döner.
// NOT: current_stock burada KABUL EDİLMEZ. İstemci gönderse bile yok sayılır;
// stok yalnızca stok hareketi modülü tarafından değiştirilecek.

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// String alanları normalize eder; boş ise null döner (sku/barcode nullable).
function optionalTrimmed(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
}

// min_stock_level opsiyonel; verilirse >= 0 sayı olmalı, verilmezse 0.
function parseMinStock(value) {
  if (value == null || value === '') return 0;
  const num = Number(value);
  if (Number.isNaN(num) || num < 0) {
    throw new AppError('min_stock_level 0 veya daha büyük bir sayı olmalıdır', 422);
  }
  return num;
}

function validateCreateProduct(body) {
  const name = (body.name || '').trim();
  const categoryId = (body.category_id || '').trim();
  const unitId = (body.unit_id || '').trim();
  const defaultSupplierIdRaw = optionalTrimmed(body.default_supplier_id);

  if (!name || !categoryId || !unitId) {
    throw new AppError('name, category_id ve unit_id zorunludur', 422);
  }
  if (name.length > 150) {
    throw new AppError('Ürün adı en fazla 150 karakter olabilir', 422);
  }
  if (!UUID_PATTERN.test(categoryId)) {
    throw new AppError('category_id geçerli bir kimlik olmalıdır', 422);
  }
  if (!UUID_PATTERN.test(unitId)) {
    throw new AppError('unit_id geçerli bir kimlik olmalıdır', 422);
  }
  if (defaultSupplierIdRaw && !UUID_PATTERN.test(defaultSupplierIdRaw)) {
    throw new AppError('default_supplier_id geçerli bir kimlik olmalıdır', 422);
  }

  return {
    name,
    categoryId,
    unitId,
    sku: optionalTrimmed(body.sku),
    barcode: optionalTrimmed(body.barcode),
    minStockLevel: parseMinStock(body.min_stock_level),
    defaultSupplierId: defaultSupplierIdRaw,
  };
}

// Güncelleme create ile aynı kurallara tabi.
function validateUpdateProduct(body) {
  return validateCreateProduct(body);
}

module.exports = {
  validateCreateProduct,
  validateUpdateProduct,
};
