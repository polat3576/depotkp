import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from '../api/authApi';
import { setAuthToken } from '../api/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');
        if (storedToken) {
          setAuthToken(storedToken);
          setToken(storedToken);
          setUser(storedUser ? JSON.parse(storedUser) : null);
        }
      } catch {
        // Bozuk/okunamayan oturum verisi varsa çıkışta bırak.
      } finally {
        setIsBooting(false);
      }
    }
    loadSession();
  }, []);

  // credentials: { restaurantEmail, userCode, password }
  const login = useCallback(async (credentials) => {
    const result = await authApi.login(credentials);
    await AsyncStorage.setItem('token', result.token);
    await AsyncStorage.setItem('user', JSON.stringify(result.user));
    setAuthToken(result.token);
    setToken(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'user']);
    } catch {
      // Depolama temizlenemese bile oturumu kapat.
    } finally {
      setAuthToken(null);
      setToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isBooting,
      isAuthenticated: Boolean(token),
      isAdmin: user?.role === 'admin',
      login,
      logout,
    }),
    [user, token, isBooting, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
