import api, { unwrap } from './axiosClient';

export function getCategories() {
  return api.get('/categories').then(unwrap);
}

// { name, description? } -> admin only
export function createCategory(payload) {
  return api.post('/categories', payload).then(unwrap);
}
