const AppError = require('../utils/AppError');
const supplierRepository = require('../repositories/supplier.repository');

// Tüm işlemler business_id ile sınırlıdır (multi-tenant).

async function listSuppliers(businessId, { includeInactive = false } = {}) {
  return supplierRepository.findAllForBusiness(businessId, { includeInactive });
}

async function getSupplier(businessId, id) {
  const supplier = await supplierRepository.findById(id, businessId);
  if (!supplier) {
    throw new AppError('Tedarikçi bulunamadı', 404);
  }
  return supplier;
}

async function createSupplier(businessId, data) {
  const nameTaken = await supplierRepository.existsByName(businessId, data.name);
  if (nameTaken) {
    throw new AppError('Bu isimde bir tedarikçi zaten var', 409);
  }
  return supplierRepository.create({ businessId, ...data });
}

async function updateSupplier(businessId, id, data) {
  const existing = await supplierRepository.findById(id, businessId);
  if (!existing) {
    throw new AppError('Tedarikçi bulunamadı', 404);
  }

  const nameTaken = await supplierRepository.existsByName(businessId, data.name, id);
  if (nameTaken) {
    throw new AppError('Bu isimde bir tedarikçi zaten var', 409);
  }

  return supplierRepository.update(id, businessId, data);
}

async function deleteSupplier(businessId, id) {
  const existing = await supplierRepository.findById(id, businessId);
  if (!existing) {
    throw new AppError('Tedarikçi bulunamadı', 404);
  }
  // Soft delete: kayıt silinmez, is_active = false yapılır.
  return supplierRepository.softDelete(id, businessId);
}

module.exports = {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
