const { errorResponse } = require('../utils/response');

// Tanımlı olmayan route'lara düşen istekleri yakalar
function notFound(req, res, next) {
  errorResponse(res, `Route bulunamadı: ${req.originalUrl}`, 404);
}

// Uygulama genelindeki tüm hataları tek noktadan yönetir
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV !== 'test') {
    const statusCode = err.statusCode || 500;
    const logPayload = statusCode >= 500 ? err : err.message;
    console.error('[ERROR]', logPayload);
  }

  // PostgreSQL "invalid_text_representation" (ör. hatalı biçimli UUID param'ı).
  // Ham DB mesajını sızdırmadan temiz bir 400 döner.
  if (err.code === '22P02') {
    return errorResponse(res, 'Geçersiz parametre biçimi', 400);
  }

  const statusCode = err.statusCode || 500;
  errorResponse(res, err.message || 'Sunucu hatası', statusCode);
}

module.exports = {
  notFound,
  errorHandler,
};
