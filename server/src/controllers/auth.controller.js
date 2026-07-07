const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/response');
const authService = require('../services/auth.service');
const {
  validateLogin,
  validateRegister,
  validateCreateUser,
} = require('../validations/auth.validation');

// POST /api/auth/login  (restaurantEmail + userCode + password)
const login = asyncHandler(async (req, res) => {
  const { restaurantEmail, userCode, password } = validateLogin(req.body);
  const result = await authService.login(restaurantEmail, userCode, password);
  return successResponse(res, result, 'Giriş başarılı');
});

// POST /api/auth/register  (public - yeni işletme + admin, otomatik giriş)
const register = asyncHandler(async (req, res) => {
  const data = validateRegister(req.body);
  const result = await authService.register(data);
  return successResponse(res, result, 'Kayıt başarılı', 201);
});

// GET /api/auth/me  (auth middleware'den geçmiş olmalı)
const me = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);
  return successResponse(res, user, 'Kullanıcı bilgisi');
});

// POST /api/auth/users  (yalnızca admin - public register yok)
// Yeni kullanıcı, işlemi yapan admin'in işletmesine (business_id) eklenir.
const createUser = asyncHandler(async (req, res) => {
  const data = validateCreateUser(req.body);
  const user = await authService.createUser({
    ...data,
    business_id: req.user.business_id,
  });
  return successResponse(res, user, 'Kullanıcı oluşturuldu', 201);
});

// GET /api/auth/users  (yalnızca admin) - işletmenin kullanıcı listesi
const listUsers = asyncHandler(async (req, res) => {
  const users = await authService.listUsers(req.user.business_id);
  return successResponse(res, users, 'Kullanıcılar listelendi');
});

// DELETE /api/auth/users/:id  (yalnızca admin) - kullanıcıyı pasifleştir
const deactivateUser = asyncHandler(async (req, res) => {
  const user = await authService.deactivateUser({
    businessId: req.user.business_id,
    targetUserId: req.params.id,
    currentUserId: req.user.id,
  });
  return successResponse(res, user, 'Kullanıcı pasife alındı');
});

module.exports = {
  login,
  register,
  me,
  createUser,
  listUsers,
  deactivateUser,
};
