import apiClient, { unwrap } from './apiClient';

export function getInventoryCounts() {
  return apiClient.get('/inventory-counts').then(unwrap);
}

export function createInventoryCount(payload = {}) {
  return apiClient.post('/inventory-counts', payload).then(unwrap);
}

export function getInventoryCount(id) {
  return apiClient.get(`/inventory-counts/${id}`).then(unwrap);
}

export function updateInventoryItems(id, items) {
  return apiClient.put(`/inventory-counts/${id}/items`, { items }).then(unwrap);
}

export function completeInventoryCount(id) {
  return apiClient.post(`/inventory-counts/${id}/complete`).then(unwrap);
}

export function cancelInventoryCount(id) {
  return apiClient.post(`/inventory-counts/${id}/cancel`).then(unwrap);
}
