import apiClient, { unwrap } from './apiClient';

// İşletmenin kullanıcı listesi (yalnızca admin). password_hash dönmez.
export function getUsers() {
  return apiClient.get('/auth/users').then(unwrap);
}

// Yeni kullanıcı oluştur (yalnızca admin).
// payload: { full_name, email, password, role }
export function createUser(payload) {
  return apiClient.post('/auth/users', payload).then(unwrap);
}

// Kullanıcıyı pasifleştir (soft delete, yalnızca admin).
export function deactivateUser(id) {
  return apiClient.delete(`/auth/users/${id}`).then(unwrap);
}
