const AppError = require('../utils/AppError');

// Hafif elle doğrulama (MVP). Hatalıysa AppError fırlatır, temiz veri döner.

function validateCreateCategory(body) {
  const name = (body.name || '').trim();
  const description = body.description != null ? String(body.description).trim() : null;

  if (!name) {
    throw new AppError('Kategori adı zorunludur', 422);
  }
  if (name.length > 100) {
    throw new AppError('Kategori adı en fazla 100 karakter olabilir', 422);
  }

  return { name, description: description || null };
}

// Güncelleme create ile aynı kurallara tabi.
function validateUpdateCategory(body) {
  return validateCreateCategory(body);
}

module.exports = {
  validateCreateCategory,
  validateUpdateCategory,
};
