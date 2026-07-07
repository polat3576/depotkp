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

const router = express.Router();

// POST /api/auth/login -> giriş yap, token al (herkese açık)
router.post('/login', login);

// POST /api/auth/register -> yeni işletme + admin oluştur (herkese açık)
router.post('/register', register);

// GET /api/auth/me -> giriş yapmış kullanıcının bilgisi (token gerekli)
router.get('/me', authenticate, me);

// GET /api/auth/users -> işletmenin kullanıcı listesi (yalnızca admin)
router.get('/users', authenticate, authorize(ROLES.ADMIN), listUsers);

// POST /api/auth/users -> yeni kullanıcı oluştur (yalnızca admin)
router.post('/users', authenticate, authorize(ROLES.ADMIN), createUser);

// DELETE /api/auth/users/:id -> kullanıcıyı pasifleştir (yalnızca admin)
router.delete('/users/:id', authenticate, authorize(ROLES.ADMIN), deactivateUser);

module.exports = router;
