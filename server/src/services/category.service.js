const AppError = require('../utils/AppError');
const categoryRepository = require('../repositories/category.repository');

// Tüm işlemler business_id ile sınırlıdır (multi-tenant).

async function listCategories(businessId, { includeInactive = false } = {}) {
  return categoryRepository.findAllForBusiness(businessId, { includeInactive });
}

async function createCategory(businessId, { name, description }) {
  const nameTaken = await categoryRepository.existsByName(businessId, name);
  if (nameTaken) {
    throw new AppError('Bu isimde bir kategori zaten var', 409);
  }
  return categoryRepository.create({ businessId, name, description });
}

async function updateCategory(businessId, id, { name, description }) {
  const existing = await categoryRepository.findById(id, businessId);
  if (!existing) {
    throw new AppError('Kategori bulunamadı', 404);
  }

  const nameTaken = await categoryRepository.existsByName(businessId, name, id);
  if (nameTaken) {
    throw new AppError('Bu isimde bir kategori zaten var', 409);
  }

  return categoryRepository.update(id, businessId, { name, description });
}

async function deleteCategory(businessId, id) {
  const existing = await categoryRepository.findById(id, businessId);
  if (!existing) {
    throw new AppError('Kategori bulunamadı', 404);
  }
  // Soft delete: kayıt silinmez, is_active = false yapılır.
  return categoryRepository.softDelete(id, businessId);
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
