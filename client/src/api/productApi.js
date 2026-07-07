import api, { unwrap } from './axiosClient';

export function getProducts() {
  return api.get('/products').then(unwrap);
}

export function getProduct(id) {
  return api.get(`/products/${id}`).then(unwrap);
}

// { name, category_id, unit_id, sku?, barcode?, min_stock_level? } -> admin only
export function createProduct(payload) {
  return api.post('/products', payload).then(unwrap);
}

// aynı alanlar -> admin only
export function updateProduct(id, payload) {
  return api.put(`/products/${id}`, payload).then(unwrap);
}

// soft delete (is_active=false) -> admin only
export function deleteProduct(id) {
  return api.delete(`/products/${id}`).then(unwrap);
}
