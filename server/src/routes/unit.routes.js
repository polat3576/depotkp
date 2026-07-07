const express = require('express');
const unitController = require('../controllers/unit.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

// Tüm birim uçları giriş gerektirir (admin + staff).
router.use(authenticate);

// GET /api/units
router.get('/', unitController.list);

module.exports = router;
