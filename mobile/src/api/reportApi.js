import apiClient, { unwrap } from './apiClient';

function withRange(path, filters) {
  const params = new URLSearchParams();
  if (filters.startDate) params.set('from', filters.startDate);
  if (filters.endDate) params.set('to', filters.endDate);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function getConsumptionReport(filters) {
  return apiClient.get(withRange('/reports/consumption', filters)).then(unwrap);
}

export function getPurchasesReport(filters) {
  return apiClient.get(withRange('/reports/purchases', filters)).then(unwrap);
}

export function getLowStockReport() {
  return apiClient.get('/reports/low-stock').then(unwrap);
}
