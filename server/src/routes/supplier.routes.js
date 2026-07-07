const express = require('express');
const supplierController = require('../controllers/supplier.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// Tüm tedarikçi uçları giriş gerektirir.
router.use(authenticate);

// Okuma uçları -> admin + staff
router.get('/', supplierController.list);
router.get('/:id', supplierController.getOne);

// Değişiklik uçları yalnızca admin.
router.post('/', authorize(ROLES.ADMIN), supplierController.create);
router.put('/:id', authorize(ROLES.ADMIN), supplierController.update);
router.delete('/:id', authorize(ROLES.ADMIN), supplierController.remove);

module.exports = router;
