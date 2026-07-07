// API yanıtlarını tek tip formatta döndürmek için ortak yardımcı fonksiyonlar

function successResponse(res, data = null, message = 'İşlem başarılı', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

function errorResponse(res, message = 'Bir hata oluştu', statusCode = 500, errors = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}

module.exports = {
  successResponse,
  errorResponse,
};
