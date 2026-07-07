const express = require('express');
const inventoryController = require('../controllers/inventoryCount.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// Tüm sayım uçları giriş gerektirir.
router.use(authenticate);

// Sayım açma, listeleme, detay ve miktar girişi -> admin + staff
router.post('/', inventoryController.create);
router.get('/', inventoryController.list);
router.get('/:id', inventoryController.getOne);
router.put('/:id/items', inventoryController.updateItems);

// Tamamlama ve iptal -> yalnızca admin (stok kalıcı değişir)
router.post('/:id/complete', authorize(ROLES.ADMIN), inventoryController.complete);
router.post('/:id/cancel', authorize(ROLES.ADMIN), inventoryController.cancel);

module.exports = router;
