import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });

    // Interceptor для добавления токена
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('vk_music_battle_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor для обработки ответов
    this.api.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('vk_music_battle_token');
          window.location.reload();
        }
        return Promise.reject(error.response?.data || error);
      }
    );
  }

  // Аутентификация
  async vkAuth(vkUserId, authKey) {
    return this.api.post('/auth/vk', { vkUserId, authKey });
  }

  async verifyToken() {
    return this.api.get('/auth/verify');
  }

  async updateProfile(data) {
    return this.api.put('/auth/profile', data);
  }

  async getUserStats(userId) {
    return this.api.get(`/auth/stats/${userId || ''}`);
  }

  // Комнаты
  async createRoom(name, settings) {
    return this.api.post('/rooms', { name, settings });
  }

  async getPublicRooms(page = 1, limit = 10) {
    return this.api.get('/rooms/public', { params: { page, limit } });
  }

  async joinRoom(code) {
    return this.api.post(`/rooms/join/${code}`);
  }

  async getRoomInfo(roomId) {
    return this.api.get(`/rooms/${roomId}`);
  }

  async leaveRoom(roomId) {
    return this.api.post(`/rooms/${roomId}/leave`);
  }

  async toggleReady(roomId) {
    return this.api.post(`/rooms/${roomId}/ready`);
  }

  async updateRoomSettings(roomId, settings) {
    return this.api.put(`/rooms/${roomId}/settings`, { settings });
  }

  async deleteRoom(roomId) {
    return this.api.delete(`/rooms/${roomId}`);
  }

  // Игры
  async startGame(roomId) {
    return this.api.post(`/games/start/${roomId}`);
  }

  async getGameInfo(gameId) {
    return this.api.get(`/games/${gameId}`);
  }

  async getCurrentRound(gameId) {
    return this.api.get(`/games/${gameId}/round`);
  }

  async submitAnswer(gameId, answer) {
    return this.api.post(`/games/${gameId}/answer`, { answer });
  }

  async getGameResults(gameId) {
    return this.api.get(`/games/${gameId}/results`);
  }

  async getLeaderboard(limit = 10) {
    return this.api.get('/games/leaderboard/global', { params: { limit } });
  }

  async getUserGameHistory(page = 1, limit = 10) {
    return this.api.get('/games/history/user', { params: { page, limit } });
  }
}

export default new ApiService();