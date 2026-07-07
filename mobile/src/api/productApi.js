import apiClient, { unwrap } from './apiClient';

export function getProducts({ includeInactive = true } = {}) {
  const query = includeInactive ? '?includeInactive=true' : '';
  return apiClient.get(`/products${query}`).then(unwrap);
}

export function createProduct(payload) {
  return apiClient.post('/products', payload).then(unwrap);
}

export function updateProduct(id, payload) {
  return apiClient.put(`/products/${id}`, payload).then(unwrap);
}

export function deleteProduct(id) {
  return apiClient.delete(`/products/${id}`).then(unwrap);
}
