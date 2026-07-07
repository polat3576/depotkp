const express = require('express');
const reportController = require('../controllers/report.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// Raporlar yönetim verisidir (maliyet vb. içerir) -> yalnızca admin.
router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

// GET /api/reports/consumption -> tüketim (OUT) raporu
router.get('/consumption', reportController.consumption);

// GET /api/reports/purchases -> alım (IN) raporu
router.get('/purchases', reportController.purchases);

// GET /api/reports/low-stock -> kritik stok raporu
router.get('/low-stock', reportController.lowStock);

module.exports = router;
