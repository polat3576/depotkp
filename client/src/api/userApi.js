import api, { unwrap } from './axiosClient';

// İşletmenin kullanıcı listesi (yalnızca admin). password_hash dönmez.
export function getUsers() {
  return api.get('/auth/users').then(unwrap);
}

// Yeni kullanıcı oluştur (yalnızca admin).
// payload: { full_name, email, user_code, password, role }
export function createUser(payload) {
  return api.post('/auth/users', payload).then(unwrap);
}

// Kullanıcıyı pasifleştir (soft delete, yalnızca admin).
export function deactivateUser(id) {
  return api.delete(`/auth/users/${id}`).then(unwrap);
}
