import api, { unwrap } from './axiosClient';

export function getSuppliers({ includeInactive = false } = {}) {
  const query = includeInactive ? '?includeInactive=true' : '';
  return api.get(`/suppliers${query}`).then(unwrap);
}

export function createSupplier(payload) {
  return api.post('/suppliers', payload).then(unwrap);
}

export function updateSupplier(id, payload) {
  return api.put(`/suppliers/${id}`, payload).then(unwrap);
}

export function deleteSupplier(id) {
  return api.delete(`/suppliers/${id}`).then(unwrap);
}
