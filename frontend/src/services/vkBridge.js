import bridge from '@vkontakte/vk-bridge';

class VKBridgeService {
  constructor() {
    this.isInitialized = false;
    this.user = null;
    this.platform = null;
    this.isVKWebAppUser = false;
  }

  async init() {
    try {
      bridge.send('VKWebAppInit');
      this.isInitialized = true;

      // Получаем информацию о пользователе
      const userInfo = await bridge.send('VKWebAppGetUserInfo');
      this.user = userInfo;
      this.isVKWebAppUser = true;

      // Получаем информацию о платформе
      const clientInfo = await bridge.send('VKWebAppGetClientVersion');
      this.platform = clientInfo.platform;

      console.log('VK Bridge initialized:', { userInfo, clientInfo });
      return userInfo;
    } catch (error) {
      console.warn('VK Bridge init failed:', error);
      // Fallback для тестирования вне VK
      this.user = {
        id: 123456789,
        first_name: 'Тест',
        last_name: 'Пользователь',
        photo_100: '',
        photo_200: ''
      };
      return this.user;
    }
  }

  async getUserInfo() {
    if (!this.isInitialized) {
      await this.init();
    }
    return this.user;
  }

  async shareLink(link, text = '') {
    try {
      await bridge.send('VKWebAppShare', {
        link,
        text
      });
      return true;
    } catch (error) {
      console.error('Share failed:', error);
      return false;
    }
  }

  async showWallPostBox(message, attachments = []) {
    try {
      await bridge.send('VKWebAppShowWallPostBox', {
        message,
        attachments
      });
      return true;
    } catch (error) {
      console.error('Wall post failed:', error);
      return false;
    }
  }

  async inviteFriends() {
    try {
      await bridge.send('VKWebAppShowInviteBox');
      return true;
    } catch (error) {
      console.error('Invite friends failed:', error);
      return false;
    }
  }

  async setViewSettings() {
    try {
      await bridge.send('VKWebAppSetViewSettings', {
        status_bar_style: 'dark',
        action_bar_color: '#3f8ae0'
      });
    } catch (error) {
      console.warn('Set view settings failed:', error);
    }
  }

  async playAudio(audioUrl) {
    try {
      // Используем Web Audio API для воспроизведения
      const audio = new Audio(audioUrl);
      audio.crossOrigin = 'anonymous';
      
      return new Promise((resolve, reject) => {
        audio.addEventListener('loadeddata', () => {
          audio.play()
            .then(() => resolve(audio))
            .catch(reject);
        });
        
        audio.addEventListener('error', reject);
        audio.load();
      });
    } catch (error) {
      console.error('Audio play failed:', error);
      throw error;
    }
  }

  async stopAudio(audioElement) {
    try {
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
    } catch (error) {
      console.error('Audio stop failed:', error);
    }
  }

  async requestNotificationPermission() {
    try {
      const result = await bridge.send('VKWebAppAllowNotifications');
      return result.result;
    } catch (error) {
      console.warn('Notification permission failed:', error);
      return false;
    }
  }

  async sendNotification(title, text) {
    try {
      await bridge.send('VKWebAppShowNotificationBox', {
        message: title,
        data: { text }
      });
      return true;
    } catch (error) {
      console.error('Send notification failed:', error);
      return false;
    }
  }

  async hapticFeedback(type = 'impact', style = 'light') {
    try {
      await bridge.send('VKWebAppTapticNotificationOccurred', {
        type // 'error', 'success', 'warning'
      });
    } catch (error) {
      try {
        await bridge.send('VKWebAppTapticImpactOccurred', {
          style // 'light', 'medium', 'heavy'
        });
      } catch (fallbackError) {
        console.warn('Haptic feedback failed:', fallbackError);
      }
    }
  }

  async getAuthKeys() {
    try {
      const keys = await bridge.send('VKWebAppGetAuthToken', {
        app_id: parseInt(process.env.REACT_APP_VK_APP_ID || '0'),
        scope: 'audio'
      });
      return keys;
    } catch (error) {
      console.warn('Get auth keys failed:', error);
      return null;
    }
  }

  async copyToClipboard(text) {
    try {
      await bridge.send('VKWebAppCopyText', { text });
      return true;
    } catch (error) {
      // Fallback для браузера
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (fallbackError) {
        console.error('Copy to clipboard failed:', fallbackError);
        return false;
      }
    }
  }

  subscribe(event, callback) {
    bridge.subscribe(callback);
  }

  unsubscribe(callback) {
    bridge.unsubscribe(callback);
  }

  isWebView() {
    return this.isVKWebAppUser;
  }

  getPlatform() {
    return this.platform || 'web';
  }

  getUserId() {
    return this.user?.id;
  }
}

export default new VKBridgeService();