const express = require('express');
const stockController = require('../controllers/stockMovement.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// Tüm stok uçları giriş gerektirir.
router.use(authenticate);

// Hareket oluştur -> admin + staff (tür bazlı yetki serviste kontrol edilir:
// staff yalnızca OUT girebilir, admin tümünü).
router.post('/movements', stockController.create);

// Bir ürünün tüm hareket geçmişi -> admin + staff
router.get('/products/:productId/movements', stockController.listByProduct);

// Bir ürünün alım geçmişi (fiyat/tedarikçi içerir) -> yalnızca admin
router.get(
  '/products/:productId/purchase-history',
  authorize(ROLES.ADMIN),
  stockController.purchaseHistory
);

module.exports = router;
