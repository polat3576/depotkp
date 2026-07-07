const express = require('express');
const categoryController = require('../controllers/category.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// Tüm kategori uçları giriş gerektirir.
router.use(authenticate);

// GET /api/categories -> admin + staff
router.get('/', categoryController.list);

// Değişiklik uçları yalnızca admin.
router.post('/', authorize(ROLES.ADMIN), categoryController.create);
router.put('/:id', authorize(ROLES.ADMIN), categoryController.update);
router.delete('/:id', authorize(ROLES.ADMIN), categoryController.remove);

module.exports = router;
