import apiClient, { unwrap } from './apiClient';

// credentials: { restaurantEmail, userCode, password }
export function login(credentials) {
  return apiClient.post('/auth/login', credentials).then(unwrap);
}

export function getMe() {
  return apiClient.get('/auth/me').then(unwrap);
}
