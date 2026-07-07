import api, { unwrap } from './axiosClient';

export function getInventoryCounts() {
  return api.get('/inventory-counts').then(unwrap);
}

export function createInventoryCount(payload = {}) {
  return api.post('/inventory-counts', payload).then(unwrap);
}

export function getInventoryCount(id) {
  return api.get(`/inventory-counts/${id}`).then(unwrap);
}

export function updateInventoryItems(id, items) {
  return api.put(`/inventory-counts/${id}/items`, { items }).then(unwrap);
}

export function completeInventoryCount(id) {
  return api.post(`/inventory-counts/${id}/complete`).then(unwrap);
}

export function cancelInventoryCount(id) {
  return api.post(`/inventory-counts/${id}/cancel`).then(unwrap);
}
