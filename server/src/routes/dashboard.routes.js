const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

// Giriş yeterli -> admin + staff (rol ayrımı yok, ama maliyet verisi dönmez).
router.use(authenticate);

// GET /api/dashboard/summary
router.get('/summary', dashboardController.summary);

module.exports = router;
