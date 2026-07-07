import api, { unwrap } from './axiosClient';

function withRange(path, filters) {
  const params = new URLSearchParams();
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  return `${path}?${params.toString()}`;
}

export function getConsumptionReport(filters) {
  return api.get(withRange('/reports/consumption', filters)).then(unwrap);
}

export function getPurchasesReport(filters) {
  return api.get(withRange('/reports/purchases', filters)).then(unwrap);
}

export function getLowStockReport() {
  return api.get('/reports/low-stock').then(unwrap);
}
