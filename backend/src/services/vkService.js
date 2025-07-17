const axios = require('axios');

class VKService {
  constructor() {
    this.baseURL = 'https://api.vk.com/method';
    this.version = '5.131';
    this.accessToken = process.env.VK_ACCESS_TOKEN;
  }

  async makeRequest(method, params = {}) {
    try {
      const response = await axios.get(`${this.baseURL}/${method}`, {
        params: {
          ...params,
          access_token: this.accessToken,
          v: this.version
        }
      });

      if (response.data.error) {
        throw new Error(`VK API Error: ${response.data.error.error_msg}`);
      }

      return response.data.response;
    } catch (error) {
      console.error('VK API request failed:', error.message);
      throw error;
    }
  }

  // Получение информации о пользователе
  async getUserInfo(userId, fields = 'first_name,last_name,photo_100') {
    try {
      const users = await this.makeRequest('users.get', {
        user_ids: userId,
        fields
      });
      return users[0];
    } catch (error) {
      console.error('Failed to get user info:', error);
      return null;
    }
  }

  // Поиск музыки по запросу
  async searchAudio(query, count = 20, offset = 0) {
    try {
      // Примечание: VK API audio методы требуют специальных прав доступа
      // В реальном приложении нужно использовать официальный SDK или альтернативные методы
      const response = await this.makeRequest('audio.search', {
        q: query,
        count,
        offset,
        sort: 2 // по популярности
      });
      
      return response.items || [];
    } catch (error) {
      console.error('Audio search failed:', error);
      // Fallback: возвращаем тестовые данные
      return this.getTestAudioData(query);
    }
  }

  // Получение популярной музыки
  async getPopularAudio(genre = '', count = 50) {
    try {
      const response = await this.makeRequest('audio.getPopular', {
        genre_id: this.getGenreId(genre),
        count
      });
      
      return response || [];
    } catch (error) {
      console.error('Failed to get popular audio:', error);
      return this.getTestAudioData();
    }
  }

  // Получение треков пользователя
  async getUserAudio(userId, count = 100) {
    try {
      const response = await this.makeRequest('audio.get', {
        owner_id: userId,
        count
      });
      
      return response.items || [];
    } catch (error) {
      console.error('Failed to get user audio:', error);
      return [];
    }
  }

  // Получение информации о треке по ID
  async getAudioById(ownerId, audioId) {
    try {
      const response = await this.makeRequest('audio.getById', {
        audios: `${ownerId}_${audioId}`
      });
      
      return response[0] || null;
    } catch (error) {
      console.error('Failed to get audio by ID:', error);
      return null;
    }
  }

  // Вспомогательные методы
  getGenreId(genre) {
    const genres = {
      'rock': 1,
      'pop': 2,
      'rap': 3,
      'easy': 4,
      'dance': 5,
      'instrumental': 6,
      'metal': 7,
      'dubstep': 8,
      'jazz': 9,
      'drum_and_bass': 10,
      'trance': 11,
      'chanson': 12,
      'ethnic': 13,
      'acoustic': 14,
      'reggae': 15,
      'classical': 16,
      'indie_pop': 17,
      'other': 18,
      'speech': 19,
      'alternative': 21,
      'electropop': 22,
      'folk': 23
    };
    
    return genres[genre] || 0;
  }

  // Тестовые данные для разработки
  getTestAudioData(query = '') {
    const testTracks = [
      {
        id: 1,
        owner_id: -2000001,
        artist: "The Beatles",
        title: "Yesterday",
        duration: 125,
        url: "https://example.com/audio1.mp3",
        preview_url: "https://example.com/preview1.mp3"
      },
      {
        id: 2,
        owner_id: -2000002,
        artist: "Queen",
        title: "Bohemian Rhapsody",
        duration: 355,
        url: "https://example.com/audio2.mp3",
        preview_url: "https://example.com/preview2.mp3"
      },
      {
        id: 3,
        owner_id: -2000003,
        artist: "Imagine Dragons",
        title: "Radioactive",
        duration: 187,
        url: "https://example.com/audio3.mp3",
        preview_url: "https://example.com/preview3.mp3"
      },
      {
        id: 4,
        owner_id: -2000004,
        artist: "Billie Eilish",
        title: "Bad Guy",
        duration: 194,
        url: "https://example.com/audio4.mp3",
        preview_url: "https://example.com/preview4.mp3"
      },
      {
        id: 5,
        owner_id: -2000005,
        artist: "Coldplay",
        title: "Yellow",
        duration: 267,
        url: "https://example.com/audio5.mp3",
        preview_url: "https://example.com/preview5.mp3"
      }
    ];

    if (query) {
      return testTracks.filter(track => 
        track.artist.toLowerCase().includes(query.toLowerCase()) ||
        track.title.toLowerCase().includes(query.toLowerCase())
      );
    }

    return testTracks;
  }

  // Генерация случайного трека для игры
  async getRandomTrackForGame(difficulty = 'medium') {
    try {
      let tracks;
      
      switch (difficulty) {
        case 'easy':
          tracks = await this.getPopularAudio('pop', 50);
          break;
        case 'hard':
          tracks = await this.getPopularAudio('', 100);
          break;
        default:
          tracks = await this.getPopularAudio('', 75);
      }

      if (!tracks || tracks.length === 0) {
        tracks = this.getTestAudioData();
      }

      const randomIndex = Math.floor(Math.random() * tracks.length);
      return tracks[randomIndex];
    } catch (error) {
      console.error('Failed to get random track:', error);
      const testData = this.getTestAudioData();
      return testData[Math.floor(Math.random() * testData.length)];
    }
  }

  // Проверка валидности VK User ID
  isValidVKUserId(userId) {
    return userId && parseInt(userId) > 0;
  }

  // Создание ссылки для шаринга
  createShareLink(url, text) {
    const shareUrl = `https://vk.com/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`;
    return shareUrl;
  }
}

module.exports = new VKService();