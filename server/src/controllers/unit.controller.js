const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/response');
const unitService = require('../services/unit.service');

// GET /api/units  (admin + staff)
const list = asyncHandler(async (req, res) => {
  const units = await unitService.listUnits(req.user.business_id);
  return successResponse(res, units, 'Birimler listelendi');
});

module.exports = {
  list,
};
