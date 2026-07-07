const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/response');
const dashboardService = require('../services/dashboard.service');

// GET /api/dashboard/summary  (admin + staff)
const summary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getSummary(req.user.business_id);
  return successResponse(res, data, 'Dashboard özeti');
});

module.exports = {
  summary,
};
