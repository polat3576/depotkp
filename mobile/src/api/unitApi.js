import apiClient, { unwrap } from './apiClient';

export function getUnits() {
  return apiClient.get('/units').then(unwrap);
}
