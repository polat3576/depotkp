const AppError = require('../utils/AppError');

// Hafif elle doğrulama (MVP). Hatalıysa AppError fırlatır, normalize veri döner.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Opsiyonel string alanı normalize eder; boşsa null döner.
function optionalTrimmed(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
}

function validateCreateSupplier(body) {
  const name = (body.name || '').trim();

  if (!name) {
    throw new AppError('Tedarikçi adı zorunludur', 422);
  }
  if (name.length > 150) {
    throw new AppError('Tedarikçi adı en fazla 150 karakter olabilir', 422);
  }

  const email = optionalTrimmed(body.email);
  if (email && !EMAIL_PATTERN.test(email)) {
    throw new AppError('Geçerli bir e-posta adresi giriniz', 422);
  }

  return {
    name,
    phone: optionalTrimmed(body.phone),
    email,
    address: optionalTrimmed(body.address),
    note: optionalTrimmed(body.note),
  };
}

// Güncelleme create ile aynı kurallara tabi.
function validateUpdateSupplier(body) {
  return validateCreateSupplier(body);
}

module.exports = {
  validateCreateSupplier,
  validateUpdateSupplier,
};
