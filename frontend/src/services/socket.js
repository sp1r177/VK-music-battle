import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    const serverUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
    
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  // Управление комнатами
  joinRoom(roomId) {
    if (this.socket) {
      this.socket.emit('join-room', roomId);
    }
  }

  leaveRoom(roomId) {
    if (this.socket) {
      this.socket.emit('leave-room', roomId);
    }
  }

  // Управление играми
  joinGame(gameId) {
    if (this.socket) {
      this.socket.emit('join-game', gameId);
    }
  }

  leaveGame(gameId) {
    if (this.socket) {
      this.socket.emit('leave-game', gameId);
    }
  }

  // События комнаты
  emitPlayerReadyChanged(roomId, playerId, isReady) {
    if (this.socket) {
      this.socket.emit('player-ready-changed', { roomId, playerId, isReady });
    }
  }

  emitPlayerJoined(roomId, player) {
    if (this.socket) {
      this.socket.emit('player-joined', { roomId, player });
    }
  }

  emitPlayerLeft(roomId, playerId) {
    if (this.socket) {
      this.socket.emit('player-left', { roomId, playerId });
    }
  }

  // События игры
  emitGameStarted(roomId, gameId) {
    if (this.socket) {
      this.socket.emit('game-started', { roomId, gameId });
    }
  }

  emitRoundStarted(gameId, round) {
    if (this.socket) {
      this.socket.emit('round-started', { gameId, round });
    }
  }

  emitRoundEnded(gameId, results) {
    if (this.socket) {
      this.socket.emit('round-ended', { gameId, results });
    }
  }

  emitGameEnded(gameId, results) {
    if (this.socket) {
      this.socket.emit('game-ended', { gameId, results });
    }
  }

  emitAnswerSubmitted(gameId, playerId, isCorrect, responseTime) {
    if (this.socket) {
      this.socket.emit('answer-submitted', { gameId, playerId, isCorrect, responseTime });
    }
  }

  emitScoreUpdated(gameId, scores) {
    if (this.socket) {
      this.socket.emit('score-updated', { gameId, scores });
    }
  }

  // Подписка на события
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      
      // Сохраняем ссылку для возможности отписки
      if (!this.listeners.has(event)) {
        this.listeners.set(event, new Set());
      }
      this.listeners.get(event).add(callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
      
      if (this.listeners.has(event)) {
        this.listeners.get(event).delete(callback);
      }
    }
  }

  // Отписка от всех событий определенного типа
  removeAllListeners(event) {
    if (this.socket && this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      callbacks.forEach(callback => {
        this.socket.off(event, callback);
      });
      this.listeners.delete(event);
    }
  }

  // Проверка подключения
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  // Получение ID сокета
  getSocketId() {
    return this.socket?.id;
  }

  // Универсальный emit
  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  // Emit с ответом (Promise-based)
  emitWithAck(event, data, timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      const timer = setTimeout(() => {
        reject(new Error('Socket timeout'));
      }, timeout);

      this.socket.emit(event, data, (response) => {
        clearTimeout(timer);
        resolve(response);
      });
    });
  }
}

export default new SocketService();