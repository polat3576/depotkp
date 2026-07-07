const AppError = require('../utils/AppError');
const { ROLES } = require('../constants/roles');

// MVP için hafif, elle yazılmış doğrulama. İleride Joi/Zod'a geçilebilir.
// Gelen body'i kontrol eder, hatalıysa AppError fırlatır.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Login: restaurantEmail + userCode + password
function validateLogin(body) {
  const restaurantEmail = (body.restaurantEmail || '').trim().toLowerCase();
  const userCode = (body.userCode || '').trim();
  const password = body.password || '';

  if (!restaurantEmail || !userCode || !password) {
    throw new AppError('restaurantEmail, userCode ve password zorunludur', 422);
  }

  if (!EMAIL_PATTERN.test(restaurantEmail)) {
    throw new AppError('Geçerli bir restoran e-postası giriniz', 422);
  }

  return { restaurantEmail, userCode, password };
}

// Public kayıt (POST /auth/register): restoran + ilk ADMIN kullanıcı oluşturur.
function validateRegister(body) {
  const restaurantName = (body.restaurantName || body.business_name || '').trim();
  const restaurantEmail = (body.restaurantEmail || '').trim().toLowerCase();
  const fullName = (body.full_name || body.fullName || '').trim();
  const userCode = (body.userCode || '').trim();
  const password = body.password || '';

  if (!restaurantName || !restaurantEmail || !fullName || !userCode || !password) {
    throw new AppError(
      'restaurantName, restaurantEmail, full_name, userCode ve password zorunludur',
      422
    );
  }
  if (restaurantName.length > 150) {
    throw new AppError('Restoran adı en fazla 150 karakter olabilir', 422);
  }
  if (!EMAIL_PATTERN.test(restaurantEmail)) {
    throw new AppError('Geçerli bir restoran e-postası giriniz', 422);
  }
  if (password.length < 6) {
    throw new AppError('Şifre en az 6 karakter olmalıdır', 422);
  }

  return { restaurantName, restaurantEmail, fullName, userCode, password };
}

// Admin'in yeni kullanıcı oluşturması (POST /auth/users).
// role ADMIN/STAFF (büyük harf) kabul edilir; DB için küçük harfe normalize edilir.
function validateCreateUser(body) {
  const full_name = (body.full_name || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const user_code = (body.user_code || body.userCode || '').trim();
  const password = body.password || '';
  const role = (body.role || '').trim().toLowerCase();

  if (!full_name || !email || !user_code || !password || !role) {
    throw new AppError('full_name, email, user_code, password ve role zorunludur', 422);
  }

  if (!EMAIL_PATTERN.test(email)) {
    throw new AppError('Geçerli bir e-posta adresi giriniz', 422);
  }

  if (password.length < 6) {
    throw new AppError('Şifre en az 6 karakter olmalıdır', 422);
  }

  const allowedRoles = [ROLES.ADMIN, ROLES.STAFF];
  if (!allowedRoles.includes(role)) {
    throw new AppError('role yalnızca ADMIN veya STAFF olabilir', 422);
  }

  return { full_name, email, user_code, password, role };
}

module.exports = {
  validateLogin,
  validateRegister,
  validateCreateUser,
};
