const express = require('express');
const { healthCheck, dbHealthCheck } = require('../controllers/health.controller');

const router = express.Router();

// GET /health -> API ayakta mı
router.get('/', healthCheck);

// GET /health/db -> Veritabanı bağlantısı çalışıyor mu
router.get('/db', dbHealthCheck);

module.exports = router;
