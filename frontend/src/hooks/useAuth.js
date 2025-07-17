import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';
import vkBridge from '../services/vkBridge';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Проверка сохранённого токена при загрузке
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('vk_music_battle_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await apiService.verifyToken();
      if (response.success && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('vk_music_battle_token');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('vk_music_battle_token');
      setError(error.error || 'Ошибка аутентификации');
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (vkUserId, authKey = null) => {
    setLoading(true);
    setError(null);

    try {
      // Если нет VK ID, получаем из VK Bridge
      if (!vkUserId) {
        const vkUser = await vkBridge.getUserInfo();
        vkUserId = vkUser.id;
      }

      // Получаем ключи аутентификации если нужно
      if (!authKey) {
        const authKeys = await vkBridge.getAuthKeys();
        authKey = authKeys?.access_token;
      }

      const response = await apiService.vkAuth(vkUserId, authKey);
      
      if (response.success && response.token && response.user) {
        localStorage.setItem('vk_music_battle_token', response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        
        // Запрашиваем разрешение на уведомления
        vkBridge.requestNotificationPermission();
        
        return response.user;
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError(error.error || error.message || 'Ошибка входа');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('vk_music_battle_token');
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  const updateUser = useCallback((userData) => {
    if (userData) {
      setUser(prevUser => ({ ...prevUser, ...userData }));
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await apiService.verifyToken();
      if (response.success && response.user) {
        setUser(response.user);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  }, [isAuthenticated]);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    updateUser,
    refreshUserData,
    checkAuthState
  };
}