// Async controller fonksiyonlarındaki try/catch tekrarını önler.
// İçeride oluşan hataları otomatik olarak next() ile error middleware'e iletir.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
