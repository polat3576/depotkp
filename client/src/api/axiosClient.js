import axios from 'axios';

// Backend ile haberleşen tek axios instance'ı.
// Deploy'da VITE_API_URL verilmelidir. Geliştirmede aynı cihazın 3001 portuna düşer.
const fallbackBaseURL =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3001/api`
    : '/api';

const baseURL = import.meta.env.VITE_API_URL || fallbackBaseURL;

const api = axios.create({ baseURL });

// Her isteğe localStorage'daki token'ı ekler.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 gelirse oturumu temizleyip login'e yönlendirir.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Backend yanıtı { success, message, data } biçiminde; data'yı çıkaran yardımcı.
export function unwrap(response) {
  return response.data.data;
}

// Hata mesajını kullanıcıya gösterilebilir metne çevirir.
export function getErrorMessage(error, fallback = 'Bir hata oluştu') {
  return error?.response?.data?.message || fallback;
}

export default api;
