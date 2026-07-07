const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');

// Authorization: Bearer <token> header'ını doğrular.
// Geçerliyse req.user'a temel kullanıcı bilgisini koyar.
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    return next(new AppError('Yetkilendirme tokenı gerekli', 401));
  }

  const token = header.slice(7); // "Bearer " sonrası

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    // Yeni JWT: { userId, restaurantId, role(ADMIN|STAFF) }.
    // Eski token'larla ({ sub, business_id, role }) geriye uyum için fallback.
    // role içeride küçük harfe çevrilir -> tüm modüller (authorize, ROLES) değişmeden çalışır.
    req.user = {
      id: decoded.userId || decoded.sub,
      business_id: decoded.restaurantId || decoded.business_id,
      role: String(decoded.role || '').toLowerCase(),
    };
    return next();
  } catch (err) {
    return next(new AppError('Geçersiz veya süresi dolmuş token', 401));
  }
}

module.exports = { authenticate };
