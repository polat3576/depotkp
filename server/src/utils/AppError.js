// Uygulama içinde bilinçli olarak fırlatılan (beklenen) hatalar için özel sınıf.
// statusCode taşıdığı için error middleware doğru HTTP kodunu döndürebilir.
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // beklenen/yönetilen hata olduğunu belirtir
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
