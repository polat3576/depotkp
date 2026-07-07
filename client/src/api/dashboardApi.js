import api, { unwrap } from './axiosClient';

export function getSummary() {
  return api.get('/dashboard/summary').then(unwrap);
}
