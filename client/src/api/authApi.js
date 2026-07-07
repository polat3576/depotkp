import api, { unwrap } from './axiosClient';

// Giriş: { restaurantEmail, userCode, password } -> { token, user } döner
export function login(credentials) {
  return api.post('/auth/login', credentials).then(unwrap);
}

// Yeni restoran + ilk admin oluşturur, { token, user } döner (otomatik giriş)
// payload: { restaurantName, restaurantEmail, full_name, userCode, password }
export function register(payload) {
  return api.post('/auth/register', payload).then(unwrap);
}

// Giriş yapmış kullanıcının güncel bilgisi
export function getMe() {
  return api.get('/auth/me').then(unwrap);
}
