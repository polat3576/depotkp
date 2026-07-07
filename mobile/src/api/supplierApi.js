import apiClient, { unwrap } from './apiClient';

export function getSuppliers({ includeInactive = false } = {}) {
  const query = includeInactive ? '?includeInactive=true' : '';
  return apiClient.get(`/suppliers${query}`).then(unwrap);
}

export function createSupplier(payload) {
  return apiClient.post('/suppliers', payload).then(unwrap);
}

export function updateSupplier(id, payload) {
  return apiClient.put(`/suppliers/${id}`, payload).then(unwrap);
}

export function deleteSupplier(id) {
  return apiClient.delete(`/suppliers/${id}`).then(unwrap);
}
