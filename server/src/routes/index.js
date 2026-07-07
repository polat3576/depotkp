const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const unitRoutes = require('./unit.routes');
const categoryRoutes = require('./category.routes');
const productRoutes = require('./product.routes');
const supplierRoutes = require('./supplier.routes');
const stockRoutes = require('./stock.routes');
const inventoryRoutes = require('./inventory.routes');
const reportRoutes = require('./report.routes');
const dashboardRoutes = require('./dashboard.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/units', unitRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/stock', stockRoutes);
router.use('/inventory-counts', inventoryRoutes);
router.use('/reports', reportRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
