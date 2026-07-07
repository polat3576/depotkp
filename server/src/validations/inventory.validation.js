const AppError = require('../utils/AppError');

// Hafif elle doğrulama (MVP). Hatalıysa AppError fırlatır, normalize veri döner.

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateCreateCount(body) {
  const note = body.note != null ? String(body.note).trim() || null : null;
  return { note };
}

// Sayılan miktarların toplu girişi:
// { items: [ { product_id, counted_quantity, note? }, ... ] }
function validateUpdateItems(body) {
  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw new AppError('En az bir sayım kalemi (items) gönderilmelidir', 422);
  }

  const items = body.items.map((raw, index) => {
    const productId = (raw.product_id || '').trim();
    if (!UUID_PATTERN.test(productId)) {
      throw new AppError(`items[${index}].product_id geçerli bir kimlik olmalıdır`, 422);
    }

    const countedQuantity = Number(raw.counted_quantity);
    if (Number.isNaN(countedQuantity) || countedQuantity < 0) {
      throw new AppError(
        `items[${index}].counted_quantity 0 veya daha büyük bir sayı olmalıdır`,
        422
      );
    }

    const note = raw.note != null ? String(raw.note).trim() || null : null;

    return { productId, countedQuantity, note };
  });

  return { items };
}

module.exports = {
  validateCreateCount,
  validateUpdateItems,
};
