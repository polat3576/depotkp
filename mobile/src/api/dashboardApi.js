import apiClient, { unwrap } from './apiClient';

export function getDashboardSummary() {
  return apiClient.get('/dashboard/summary').then(unwrap);
}
