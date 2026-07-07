import apiClient, { unwrap } from './apiClient';

export function getCategories() {
  return apiClient.get('/categories').then(unwrap);
}
