const AppError = require('../utils/AppError');
const { MOVEMENT_TYPES, DIRECTIONS } = require('../constants/movementTypes');

// Hafif elle doğrulama (MVP). Hatalıysa AppError fırlatır, normalize veri döner.

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parsePositiveNumber(value, field) {
  const num = Number(value);
  if (Number.isNaN(num) || num <= 0) {
    throw new AppError(`${field} 0'dan büyük bir sayı olmalıdır`, 422);
  }
  return num;
}

function validateCreateMovement(body) {
  const productId = (body.product_id || '').trim();
  const movementType = (body.movement_type || '').trim();
  const note = body.note != null ? String(body.note).trim() || null : null;

  if (!productId || !movementType) {
    throw new AppError('product_id ve movement_type zorunludur', 422);
  }
  if (!UUID_PATTERN.test(productId)) {
    throw new AppError('product_id geçerli bir kimlik olmalıdır', 422);
  }

  const validTypes = Object.values(MOVEMENT_TYPES);
  if (!validTypes.includes(movementType)) {
    throw new AppError(`movement_type şunlardan biri olmalı: ${validTypes.join(', ')}`, 422);
  }

  const quantity = parsePositiveNumber(body.quantity, 'quantity');

  // Yön belirleme:
  //  IN  -> her zaman 'in'
  //  OUT -> her zaman 'out'
  //  ADJUSTMENT / COUNT_CORRECTION -> istemci belirtmeli
  let direction;
  if (movementType === MOVEMENT_TYPES.IN) {
    direction = DIRECTIONS.IN;
  } else if (movementType === MOVEMENT_TYPES.OUT) {
    direction = DIRECTIONS.OUT;
  } else {
    direction = (body.direction || '').trim();
    if (![DIRECTIONS.IN, DIRECTIONS.OUT].includes(direction)) {
      throw new AppError(
        "Bu hareket türü için direction 'in' veya 'out' olmalıdır",
        422
      );
    }
  }

  // unit_cost, supplier_id, document_no yalnızca IN (alım) için anlamlıdır.
  let unitCost = null;
  let supplierId = null;
  let documentNo = null;

  if (movementType === MOVEMENT_TYPES.IN) {
    // Alımda birim fiyat zorunlu (fiyat geçmişini sağlam tutmak için).
    unitCost = parsePositiveNumber(body.unit_cost, 'unit_cost');

    if (body.supplier_id != null && String(body.supplier_id).trim() !== '') {
      supplierId = String(body.supplier_id).trim();
      if (!UUID_PATTERN.test(supplierId)) {
        throw new AppError('supplier_id geçerli bir kimlik olmalıdır', 422);
      }
    }
    documentNo = body.document_no != null ? String(body.document_no).trim() || null : null;
  }

  // occurred_at opsiyonel; verilmezse DB now() kullanır. Verilirse geçerli tarih olmalı.
  let occurredAt = null;
  if (body.occurred_at != null && String(body.occurred_at).trim() !== '') {
    const d = new Date(body.occurred_at);
    if (Number.isNaN(d.getTime())) {
      throw new AppError('occurred_at geçerli bir tarih olmalıdır', 422);
    }
    occurredAt = d.toISOString();
  }

  return {
    productId,
    movementType,
    direction,
    quantity,
    unitCost,
    supplierId,
    documentNo,
    note,
    occurredAt,
  };
}

module.exports = {
  validateCreateMovement,
};
