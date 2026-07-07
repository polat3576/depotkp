import api, { unwrap } from './axiosClient';

export function getUnits() {
  return api.get('/units').then(unwrap);
}
