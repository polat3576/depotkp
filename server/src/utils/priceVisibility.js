const { ROLES } = require('../constants/roles');

// STAFF'a kesinlikle dönmemesi gereken fiyat/maliyet alanları.
const PRICE_FIELDS = [
  'unit_cost',
  'total_cost',
  'cost',
  'total_price',
  'unit_price',
  'supplier_payment',
  'price',
];

// role ADMIN ise veri olduğu gibi döner. Aksi halde (STAFF) fiyat/maliyet
// alanları çıkarılmış bir kopya döner. data tek obje veya dizi olabilir.
function stripPriceFieldsForStaff(data, role) {
  if (role === ROLES.ADMIN) return data;

  const stripOne = (item) => {
    if (!item || typeof item !== 'object') return item;
    const clone = { ...item };
    for (const field of PRICE_FIELDS) {
      delete clone[field];
    }
    return clone;
  };

  return Array.isArray(data) ? data.map(stripOne) : stripOne(data);
}

module.exports = { stripPriceFieldsForStaff, PRICE_FIELDS };
