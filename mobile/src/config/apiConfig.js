import Constants from 'expo-constants';

function getExpoHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost;

  return hostUri?.split(':')[0];
}

function getApiBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const expoHost = getExpoHost();
  if (expoHost) {
    return `http://${expoHost}:3001/api`;
  }

  console.warn('EXPO_PUBLIC_API_URL tanımlı değil ve Expo host IP bulunamadı.');
  return '';
}

export const API_BASE_URL = getApiBaseUrl();
