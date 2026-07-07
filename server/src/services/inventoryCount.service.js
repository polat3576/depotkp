const AppError = require('../utils/AppError');
const inventoryRepository = require('../repositories/inventoryCount.repository');

// Tüm işlemler business_id ile sınırlıdır (multi-tenant).

// Yeni sayım oturumu açar (aktif ürünler otomatik snapshot'lanır).
async function createCount(businessId, userId, { note }) {
  const count = await inventoryRepository.createWithSnapshot({
    businessId,
    countedBy: userId,
    note,
  });
  const items = await inventoryRepository.findItems(count.id);
  return { ...count, items };
}

async function listCounts(businessId) {
  return inventoryRepository.findAll(businessId);
}

// Başlık + kalemler.
async function getCount(businessId, id) {
  const count = await inventoryRepository.findById(id, businessId);
  if (!count) {
    throw new AppError('Sayım bulunamadı', 404);
  }
  const items = await inventoryRepository.findItems(id);
  return { ...count, items };
}

// Sayılan miktarları günceller (yalnızca DRAFT sayımda).
async function updateItems(businessId, id, items) {
  const count = await inventoryRepository.findById(id, businessId);
  if (!count) {
    throw new AppError('Sayım bulunamadı', 404);
  }
  if (count.status !== 'DRAFT') {
    throw new AppError('Yalnızca taslak (DRAFT) sayımlar güncellenebilir', 409);
  }

  const updated = await inventoryRepository.updateCountedQuantities(id, items);
  if (updated === 0) {
    throw new AppError('Bu sayıma ait güncellenecek kalem bulunamadı', 422);
  }

  return getCount(businessId, id);
}

// Sayımı tamamlar: farklar için COUNT_CORRECTION üretir, stoğu sayıma eşitler.
async function completeCount(businessId, userId, id) {
  const result = await inventoryRepository.completeCount(id, businessId, userId);

  if (!result.ok) {
    if (result.reason === 'NOT_FOUND') {
      throw new AppError('Sayım bulunamadı', 404);
    }
    if (result.reason === 'NOT_DRAFT') {
      throw new AppError('Yalnızca taslak (DRAFT) sayımlar tamamlanabilir', 409);
    }
    throw new AppError('Sayım tamamlanamadı', 500);
  }

  return {
    status: 'COMPLETED',
    counted_items: result.countedItems,
    corrections_applied: result.corrections,
  };
}

// Sayımı iptal eder.
async function cancelCount(businessId, id) {
  const count = await inventoryRepository.findById(id, businessId);
  if (!count) {
    throw new AppError('Sayım bulunamadı', 404);
  }

  const cancelled = await inventoryRepository.cancelCount(id, businessId);
  if (!cancelled) {
    throw new AppError('Yalnızca taslak (DRAFT) sayımlar iptal edilebilir', 409);
  }

  return cancelled;
}

module.exports = {
  createCount,
  listCounts,
  getCount,
  updateItems,
  completeCount,
  cancelCount,
};
