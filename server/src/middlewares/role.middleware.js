const AppError = require('../utils/AppError');

// Belirli rollere sahip kullanıcılara izin verir.
// authenticate middleware'inden SONRA kullanılmalıdır (req.user dolu olmalı).
// Kullanım: router.post('/', authenticate, authorize(ROLES.ADMIN), handler)
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Yetkilendirme gerekli', 401));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Bu işlem için yetkiniz yok', 403));
    }
    return next();
  };
}

module.exports = { authorize };
