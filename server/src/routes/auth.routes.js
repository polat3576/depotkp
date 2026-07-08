const express = require('express');
const {
  login,
  register,
  me,
  createUser,
  listUsers,
  deactivateUser,
} = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { ROLES } = require('../constants/roles');
const env = require('../config/env');
const AppError = require('../utils/AppError');

const router = express.Router();

// Public kayıt varsayılan olarak kapalıdır. Yalnızca
// ALLOW_PUBLIC_REGISTRATION=true olduğunda /register çalışır.
function requirePublicRegistrationEnabled(req, res, next) {
  if (!env.ALLOW_PUBLIC_REGISTRATION) {
    return next(new AppError('Public registration is disabled', 403));
  }
  return next();
}

// POST /api/auth/login -> giriş yap, token al (herkese açık)
router.post('/login', login);

// POST /api/auth/register -> yeni işletme + admin oluştur
// (ALLOW_PUBLIC_REGISTRATION=true değilse 403 döner)
router.post('/register', requirePublicRegistrationEnabled, register);

// GET /api/auth/me -> giriş yapmış kullanıcının bilgisi (token gerekli)
router.get('/me', authenticate, me);

// GET /api/auth/users -> işletmenin kullanıcı listesi (yalnızca admin)
router.get('/users', authenticate, authorize(ROLES.ADMIN), listUsers);

// POST /api/auth/users -> yeni kullanıcı oluştur (yalnızca admin)
router.post('/users', authenticate, authorize(ROLES.ADMIN), createUser);

// DELETE /api/auth/users/:id -> kullanıcıyı pasifleştir (yalnızca admin)
router.delete('/users/:id', authenticate, authorize(ROLES.ADMIN), deactivateUser);

module.exports = router;
