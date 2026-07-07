// Stok hareketi türleri - stock_movements.movement_type ile eşleşir.
const MOVEMENT_TYPES = {
  IN: 'IN', // stok girişi / ürün alımı (satın alma)
  OUT: 'OUT', // depodan çıkış / kullanım
  COUNT_CORRECTION: 'COUNT_CORRECTION', // sayım farkı düzeltmesi
  ADJUSTMENT: 'ADJUSTMENT', // manuel düzeltme (fire, kayıp, hata)
};

// Hareketin stok üzerindeki yönü. Miktar hep pozitif tutulur,
// artı/eksi etkisi bu yön ile belirlenir.
const DIRECTIONS = {
  IN: 'in', // stoğu artırır (+)
  OUT: 'out', // stoğu azaltır (-)
};

module.exports = { MOVEMENT_TYPES, DIRECTIONS };
