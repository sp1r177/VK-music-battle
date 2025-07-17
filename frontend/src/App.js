import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import {
  ConfigProvider,
  AdaptivityProvider,
  AppRoot,
  SplitLayout,
  SplitCol,
  ViewWidth,
  usePlatform
} from '@vkontakte/vkui';
import '@vkontakte/vkui/dist/vkui.css';

// Сервисы
import vkBridge from './services/vkBridge';
import apiService from './services/api';
import socketService from './services/socket';

// Страницы
import HomePage from './pages/HomePage';
import RoomPage from './pages/RoomPage';
import GamePage from './pages/GamePage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';

// Компоненты
import LoadingScreen from './components/LoadingScreen';
import ErrorBoundary from './components/ErrorBoundary';

// Hooks
import { useAuth } from './hooks/useAuth';

// Инициализация для отладки (только в development)
if (process.env.NODE_ENV === 'development' && window.location.hostname === 'localhost') {
  import('eruda').then(eruda => eruda.default.init());
}

function App() {
  const platform = usePlatform();
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);
  const { user, isAuthenticated, login, logout, loading: authLoading } = useAuth();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Initializing VK Music Battle...');

      // Инициализируем VK Bridge
      const vkUser = await vkBridge.init();
      console.log('VK Bridge initialized with user:', vkUser);

      // Устанавливаем настройки внешнего вида
      await vkBridge.setViewSettings();

      // Подключаем Socket.IO
      socketService.connect();

      // Проверяем сохранённый токен
      const savedToken = localStorage.getItem('vk_music_battle_token');
      if (savedToken) {
        try {
          await apiService.verifyToken();
          console.log('Token verified successfully');
        } catch (error) {
          console.warn('Token verification failed:', error);
          localStorage.removeItem('vk_music_battle_token');
        }
      }

      // Если нет валидного токена, авторизуемся
      if (!savedToken || !isAuthenticated) {
        await login(vkUser.id);
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('App initialization failed:', error);
      setInitError(error.message || 'Ошибка инициализации приложения');
      setIsInitialized(true); // Всё равно показываем приложение
    }
  };

  if (!isInitialized || authLoading) {
    return <LoadingScreen />;
  }

  if (initError && !isAuthenticated) {
    return (
      <ConfigProvider>
        <AdaptivityProvider>
          <AppRoot>
            <SplitLayout>
              <SplitCol>
                <div style={{ 
                  padding: '20px', 
                  textAlign: 'center',
                  color: 'var(--vkui--color_text_primary)'
                }}>
                  <h2>Ошибка инициализации</h2>
                  <p>{initError}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    style={{
                      padding: '10px 20px',
                      background: 'var(--vkui--color_background_accent)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    Попробовать снова
                  </button>
                </div>
              </SplitCol>
            </SplitLayout>
          </AppRoot>
        </AdaptivityProvider>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider>
      <AdaptivityProvider>
        <AppRoot>
          <SplitLayout>
            <SplitCol 
              animate={platform !== 'desktop'}
              spaced={platform === 'desktop'}
              width={platform === 'desktop' ? '560px' : '100%'}
              maxWidth={platform === 'desktop' ? '560px' : '100%'}
            >
              <ErrorBoundary>
                <Router>
                  <Routes>
                    <Route 
                      path="/" 
                      element={
                        isAuthenticated ? 
                          <HomePage user={user} /> : 
                          <Navigate to="/auth" replace />
                      } 
                    />
                    <Route 
                      path="/room/:roomId" 
                      element={
                        isAuthenticated ? 
                          <RoomPage user={user} /> : 
                          <Navigate to="/auth" replace />
                      } 
                    />
                    <Route 
                      path="/game/:gameId" 
                      element={
                        isAuthenticated ? 
                          <GamePage user={user} /> : 
                          <Navigate to="/auth" replace />
                      } 
                    />
                    <Route 
                      path="/leaderboard" 
                      element={
                        isAuthenticated ? 
                          <LeaderboardPage user={user} /> : 
                          <Navigate to="/auth" replace />
                      } 
                    />
                    <Route 
                      path="/profile" 
                      element={
                        isAuthenticated ? 
                          <ProfilePage user={user} /> : 
                          <Navigate to="/auth" replace />
                      } 
                    />
                    <Route 
                      path="/auth" 
                      element={
                        <LoadingScreen message="Авторизация..." />
                      } 
                    />
                    <Route 
                      path="*" 
                      element={<Navigate to="/" replace />} 
                    />
                  </Routes>
                </Router>
              </ErrorBoundary>
            </SplitCol>
          </SplitLayout>
        </AppRoot>
      </AdaptivityProvider>
    </ConfigProvider>
  );
}

export default App;