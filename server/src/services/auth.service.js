const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const userRepository = require('../repositories/user.repository');

// İş kuralları burada. Repository'den gelen ham veriyi işler, token üretir.

const SALT_ROUNDS = 10;

// Kullanıcı bilgisini dışarı dönülecek güvenli hale getirir
// (password_hash asla dışarı sızmamalı).
function toPublicUser(user) {
  return {
    id: user.id,
    business_id: user.business_id,
    full_name: user.full_name,
    email: user.email,
    user_code: user.user_code,
    // role içeride küçük harf tutulur (frontend isAdmin === 'admin' kontrolü bozulmasın).
    role: user.role,
    is_active: user.is_active,
  };
}

function generateToken(user) {
  // JWT payload sözleşmesi: { userId, restaurantId, role(ADMIN|STAFF) }.
  // role JWT'de büyük harf; auth.middleware içeride küçük harfe çevirir.
  const payload = {
    userId: user.id,
    restaurantId: user.business_id,
    role: String(user.role).toUpperCase(),
  };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

// restaurantEmail + userCode + password ile giriş.
// 1) e-posta ile restoranı bul, 2) restoran içinde userCode ile kullanıcıyı bul,
// 3) bcrypt ile şifreyi doğrula. Hangi alanın hatalı olduğunu sızdırmamak için
// tüm başarısız durumlarda aynı genel mesaj verilir.
async function login(restaurantEmail, userCode, password) {
  const invalidCredentials = () =>
    new AppError('Restoran e-postası, kullanıcı kodu veya şifre hatalı', 401);

  const business = await userRepository.findBusinessByEmail(restaurantEmail);
  if (!business) {
    throw invalidCredentials();
  }
  if (business.is_active === false) {
    throw new AppError('Bu restoran pasif durumda', 403);
  }

  const user = await userRepository.findByBusinessAndCode(business.id, userCode);
  if (!user) {
    throw invalidCredentials();
  }
  if (!user.is_active) {
    throw new AppError('Bu hesap pasif durumda', 403);
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw invalidCredentials();
  }

  const token = generateToken(user);
  return { token, user: toPublicUser(user) };
}

// Public kayıt: yeni restoran (restaurantEmail ile) + ilk ADMIN kullanıcı
// (userCode ile) oluşturur ve otomatik giriş için token döner.
// İlk admin'in e-postası restoran e-postası olarak alınır (users.email zorunlu).
async function register({ restaurantName, restaurantEmail, fullName, userCode, password }) {
  const existingBusiness = await userRepository.findBusinessByEmail(restaurantEmail);
  if (existingBusiness) {
    throw new AppError('Bu restoran e-postası zaten kayıtlı', 409);
  }

  const emailTaken = await userRepository.existsByEmail(restaurantEmail);
  if (emailTaken) {
    throw new AppError('Bu e-posta ile bir kullanıcı zaten var', 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await userRepository.createBusinessWithAdmin({
    businessName: restaurantName,
    businessEmail: restaurantEmail,
    fullName,
    email: restaurantEmail, // ilk admin e-postası = restoran e-postası
    userCode,
    passwordHash,
  });

  const token = generateToken(user);
  return { token, user: toPublicUser(user) };
}

// Token doğrulandıktan sonra kullanıcının güncel bilgisini getirir.
async function getCurrentUser(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError('Kullanıcı bulunamadı', 404);
  }
  return toPublicUser(user);
}

// Admin tarafından yeni kullanıcı (admin veya staff) oluşturur.
// business_id, işlemi yapan admin'in token'ından gelir -> kullanıcı
// yalnızca kendi işletmesine kullanıcı ekleyebilir.
async function createUser({ business_id, full_name, email, user_code, password, role }) {
  const emailTaken = await userRepository.existsByEmail(email);
  if (emailTaken) {
    throw new AppError('Bu e-posta ile bir kullanıcı zaten var', 409);
  }

  // userCode aynı restoran içinde benzersiz olmalı (farklı restoranlarda tekrar edebilir).
  const codeTaken = await userRepository.existsByCodeInBusiness(business_id, user_code);
  if (codeTaken) {
    throw new AppError('Bu kullanıcı kodu bu restoranda zaten kullanılıyor', 409);
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await userRepository.create({
    business_id,
    full_name,
    email,
    user_code,
    password_hash,
    role,
  });

  return toPublicUser(user);
}

// İşletmenin kullanıcı listesi (password_hash asla dönmez).
async function listUsers(businessId) {
  const users = await userRepository.findAllForBusiness(businessId);
  return users.map(toPublicUser);
}

// Kullanıcıyı pasifleştir. Admin kendi hesabını pasifleştiremez (kilitlenme
// riski). Yalnızca aynı işletmedeki kullanıcı hedeflenebilir.
async function deactivateUser({ businessId, targetUserId, currentUserId }) {
  if (targetUserId === currentUserId) {
    throw new AppError('Kendi hesabınızı pasifleştiremezsiniz', 400);
  }

  const user = await userRepository.deactivate(targetUserId, businessId);
  if (!user) {
    throw new AppError('Kullanıcı bulunamadı', 404);
  }
  return toPublicUser(user);
}

// Kullanıcıyı yeniden aktif eder. Yalnızca aynı işletmedeki kullanıcı hedeflenebilir.
async function activateUser({ businessId, targetUserId }) {
  const user = await userRepository.activate(targetUserId, businessId);
  if (!user) {
    throw new AppError('Kullanıcı bulunamadı', 404);
  }
  return toPublicUser(user);
}

// Kullanıcıyı kalıcı olarak siler. Admin kendi hesabını silemez. Kullanıcının
// stok hareketi / sayım geçmişi varsa veritabanı bunu engeller (ON DELETE
// RESTRICT) -> bu durumda "önce pasife alın" mesajı gösterilir.
async function deleteUser({ businessId, targetUserId, currentUserId }) {
  if (targetUserId === currentUserId) {
    throw new AppError('Kendi hesabınızı silemezsiniz', 400);
  }

  try {
    const deleted = await userRepository.hardDelete(targetUserId, businessId);
    if (!deleted) {
      throw new AppError('Kullanıcı bulunamadı', 404);
    }
  } catch (err) {
    if (err.code === '23503') {
      throw new AppError(
        'Bu kullanıcının stok hareketi veya sayım geçmişi olduğu için tamamen silinemez. Bunun yerine pasife alabilirsiniz.',
        409
      );
    }
    throw err;
  }
}

module.exports = {
  login,
  register,
  getCurrentUser,
  createUser,
  listUsers,
  deactivateUser,
  activateUser,
  deleteUser,
};
