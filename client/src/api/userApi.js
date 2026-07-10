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

// Kullanıcıyı yeniden aktif et (yalnızca admin).
export function activateUser(id) {
  return api.patch(`/auth/users/${id}/activate`).then(unwrap);
}

// Kullanıcıyı kalıcı olarak sil (yalnızca admin). Hareket/sayım geçmişi
// varsa backend 409 döner.
export function deleteUserPermanently(id) {
  return api.delete(`/auth/users/${id}/permanent`).then(unwrap);
}
