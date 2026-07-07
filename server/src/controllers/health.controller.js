const { testDatabaseConnection } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/response');

// API'nin ayakta olup olmadığını döner
function healthCheck(req, res) {
  return successResponse(res, { status: 'up' }, 'API çalışıyor');
}

// Veritabanı bağlantısının çalışıp çalışmadığını döner
async function dbHealthCheck(req, res) {
  const isConnected = await testDatabaseConnection();

  if (!isConnected) {
    return errorResponse(res, 'Veritabanına bağlanılamadı', 503);
  }

  return successResponse(res, { status: 'up' }, 'Veritabanı bağlantısı başarılı');
}

module.exports = {
  healthCheck,
  dbHealthCheck,
};
