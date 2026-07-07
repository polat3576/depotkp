const express = require('express');
const productController = require('../controllers/product.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// Tüm ürün uçları giriş gerektirir.
router.use(authenticate);

// Okuma uçları -> admin + staff
router.get('/', productController.list);
router.get('/:id', productController.getOne);

// Değişiklik uçları yalnızca admin.
router.post('/', authorize(ROLES.ADMIN), productController.create);
router.put('/:id', authorize(ROLES.ADMIN), productController.update);
router.delete('/:id', authorize(ROLES.ADMIN), productController.remove);

module.exports = router;
