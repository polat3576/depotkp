const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/response');
const reportService = require('../services/report.service');

// GET /api/reports/consumption?from=&to=&period=week|month  (admin)
const consumption = asyncHandler(async (req, res) => {
  const result = await reportService.getConsumption(req.user.business_id, req.query);
  return successResponse(res, result, 'Tüketim raporu');
});

// GET /api/reports/purchases?from=&to=&period=week|month  (admin)
const purchases = asyncHandler(async (req, res) => {
  const result = await reportService.getPurchases(req.user.business_id, req.query);
  return successResponse(res, result, 'Alım raporu');
});

// GET /api/reports/low-stock  (admin)
const lowStock = asyncHandler(async (req, res) => {
  const result = await reportService.getLowStock(req.user.business_id);
  return successResponse(res, result, 'Kritik stok raporu');
});

module.exports = {
  consumption,
  purchases,
  lowStock,
};
