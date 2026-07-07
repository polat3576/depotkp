const AppError = require('../utils/AppError');

// Rapor tarih aralığını çözer. Öncelik sırası:
//   1) from/to açıkça verildiyse onlar kullanılır
//   2) period=week -> son 7 gün, period=month -> son 30 gün
//   3) hiçbiri yoksa varsayılan: son 30 gün
//
// Tarihler 'YYYY-MM-DD' veya tam ISO olabilir. Sadece tarih (10 karakter)
// verilen 'to' değeri, o günü de kapsaması için gün sonuna çekilir.

const DAY_MS = 24 * 60 * 60 * 1000;

function parseDate(value, field, endOfDay = false) {
  const raw = String(value).trim();
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    throw new AppError(`${field} geçerli bir tarih olmalıdır`, 422);
  }
  // Sadece tarih verildiyse (saat yok) ve gün sonu isteniyorsa 23:59:59.999'a çek.
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    d.setHours(23, 59, 59, 999);
  }
  return d;
}

function resolveRange(queryParams = {}) {
  const { from, to, period } = queryParams;

  const now = new Date();
  const toDate = to ? parseDate(to, 'to', true) : now;

  let fromDate;
  if (from) {
    fromDate = parseDate(from, 'from');
  } else {
    const days = period === 'week' ? 7 : 30;
    fromDate = new Date(toDate.getTime() - days * DAY_MS);
  }

  if (period && !['week', 'month'].includes(period)) {
    throw new AppError("period yalnızca 'week' veya 'month' olabilir", 422);
  }

  if (fromDate > toDate) {
    throw new AppError("'from' tarihi 'to' tarihinden sonra olamaz", 422);
  }

  return { from: fromDate.toISOString(), to: toDate.toISOString() };
}

module.exports = {
  resolveRange,
};
