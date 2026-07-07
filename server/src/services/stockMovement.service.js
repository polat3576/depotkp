const AppError = require('../utils/AppError');
const { MOVEMENT_TYPES, DIRECTIONS } = require('../constants/movementTypes');
const { ROLES } = require('../constants/roles');
const stockRepository = require('../repositories/stockMovement.repository');
const productRepository = require('../repositories/product.repository');
const supplierRepository = require('../repositories/supplier.repository');

// Tüm işlemler business_id ile sınırlıdır (multi-tenant).

// Rol bazlı kural: staff yalnızca depodan ÇIKIŞ (OUT) hareketi girebilir.
// Giriş (IN), düzeltme (ADJUSTMENT) ve sayım farkı (COUNT_CORRECTION) admin işidir.
function assertRoleCanCreate(role, movementType) {
  if (role === ROLES.ADMIN) return; // admin her türü girebilir
  if (role === ROLES.STAFF && movementType === MOVEMENT_TYPES.OUT) return;
  throw new AppError('Bu hareket türü için yetkiniz yok', 403);
}

async function createMovement({ businessId, userId, role }, data) {
  assertRoleCanCreate(role, data.movementType);

  // Ürün bu işletmeye ait ve aktif mi?
  const product = await productRepository.findById(data.productId, businessId);
  if (!product || !product.is_active) {
    throw new AppError('Ürün bulunamadı', 404);
  }

  // Tedarikçi verildiyse (yalnızca IN'de) bu işletmeye ait olmalı.
  if (data.supplierId) {
    const supplier = await supplierRepository.findById(data.supplierId, businessId);
    if (!supplier) {
      throw new AppError('Geçersiz tedarikçi', 422);
    }
  }

  // Yönü işaretli değişime çevir: 'in' => +quantity, 'out' => -quantity
  const signedDelta = (data.direction === DIRECTIONS.IN ? 1 : -1) * data.quantity;

  const result = await stockRepository.createWithStockUpdate({
    businessId,
    userId,
    movementType: data.movementType,
    direction: data.direction,
    productId: data.productId,
    quantity: data.quantity,
    unitCost: data.unitCost,
    supplierId: data.supplierId,
    documentNo: data.documentNo,
    note: data.note,
    occurredAt: data.occurredAt,
    signedDelta,
  });

  if (!result.ok) {
    if (result.reason === 'PRODUCT_NOT_FOUND') {
      throw new AppError('Ürün bulunamadı', 404);
    }
    if (result.reason === 'INSUFFICIENT_STOCK') {
      throw new AppError(
        `Yetersiz stok. Mevcut: ${result.currentStock}, çıkış: ${data.quantity}`,
        422
      );
    }
    throw new AppError('Stok hareketi oluşturulamadı', 500);
  }

  return { movement: result.movement, current_stock: result.newStock };
}

async function getProductMovements(businessId, productId) {
  // Ürünün varlığını doğrula (başka işletmenin ürünü sorgulanmasın).
  const product = await productRepository.findById(productId, businessId);
  if (!product) {
    throw new AppError('Ürün bulunamadı', 404);
  }
  return stockRepository.findByProduct(productId, businessId);
}

async function getPurchaseHistory(businessId, productId) {
  const product = await productRepository.findById(productId, businessId);
  if (!product) {
    throw new AppError('Ürün bulunamadı', 404);
  }
  return stockRepository.findPurchaseHistory(productId, businessId);
}

module.exports = {
  createMovement,
  getProductMovements,
  getPurchaseHistory,
};
