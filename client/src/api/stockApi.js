import api, { unwrap } from './axiosClient';

// payload: { product_id, movement_type, quantity, unit_cost?, supplier_id?, document_no?, note?, direction? }
// { movement, current_stock } döner
export function createMovement(payload) {
  return api.post('/stock/movements', payload).then(unwrap);
}

export function getProductMovements(productId) {
  return api.get(`/stock/products/${productId}/movements`).then(unwrap);
}
