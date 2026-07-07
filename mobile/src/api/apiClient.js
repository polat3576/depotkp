import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

let cachedToken = null;
let tokenLoaded = false;

export function setAuthToken(token) {
  cachedToken = token || null;
  tokenLoaded = true;
}

apiClient.interceptors.request.use(async (config) => {
  if (!tokenLoaded) {
    cachedToken = await AsyncStorage.getItem('token');
    tokenLoaded = true;
  }
  const token = cachedToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function unwrap(response) {
  return response.data.data;
}

export function getErrorMessage(error, fallback = 'İşlem tamamlanamadı') {
  return error?.response?.data?.message || error?.message || fallback;
}

export default apiClient;
