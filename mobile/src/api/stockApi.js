import apiClient, { unwrap } from './apiClient';

export function createMovement(payload) {
  return apiClient.post('/stock/movements', payload).then(unwrap);
}
