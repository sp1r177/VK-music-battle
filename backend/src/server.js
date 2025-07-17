require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cron = require('node-cron');
const connectDB = require('../config/database');
const gameService = require('./services/gameService');

// Импорт маршрутов
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const gameRoutes = require('./routes/games');

// Инициализация приложения
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Подключение к базе данных
connectDB();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Маршруты API
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/games', gameRoutes);

// Статический контент для продакшена
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('public'));
  
  app.get('*', (req, res) => {
    res.sendFile('index.html', { root: 'public' });
  });
}

// Базовый маршрут
app.get('/api', (req, res) => {
  res.json({ 
    message: 'VK Music Battle API',
    version: '1.0.0',
    status: 'running'
  });
});

// Socket.IO для реального времени
const activeRooms = new Map();
const activeGames = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Присоединение к комнате
  socket.on('join-room', (roomId) => {
    socket.join(`room-${roomId}`);
    
    if (!activeRooms.has(roomId)) {
      activeRooms.set(roomId, new Set());
    }
    activeRooms.get(roomId).add(socket.id);
    
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  // Покидание комнаты
  socket.on('leave-room', (roomId) => {
    socket.leave(`room-${roomId}`);
    
    if (activeRooms.has(roomId)) {
      activeRooms.get(roomId).delete(socket.id);
      if (activeRooms.get(roomId).size === 0) {
        activeRooms.delete(roomId);
      }
    }
    
    console.log(`Socket ${socket.id} left room ${roomId}`);
  });

  // Присоединение к игре
  socket.on('join-game', (gameId) => {
    socket.join(`game-${gameId}`);
    
    if (!activeGames.has(gameId)) {
      activeGames.set(gameId, new Set());
    }
    activeGames.get(gameId).add(socket.id);
    
    console.log(`Socket ${socket.id} joined game ${gameId}`);
  });

  // Покидание игры
  socket.on('leave-game', (gameId) => {
    socket.leave(`game-${gameId}`);
    
    if (activeGames.has(gameId)) {
      activeGames.get(gameId).delete(socket.id);
      if (activeGames.get(gameId).size === 0) {
        activeGames.delete(gameId);
      }
    }
    
    console.log(`Socket ${socket.id} left game ${gameId}`);
  });

  // Изменение готовности игрока
  socket.on('player-ready-changed', (data) => {
    socket.to(`room-${data.roomId}`).emit('player-ready-changed', data);
  });

  // Новый игрок присоединился к комнате
  socket.on('player-joined', (data) => {
    socket.to(`room-${data.roomId}`).emit('player-joined', data);
  });

  // Игрок покинул комнату
  socket.on('player-left', (data) => {
    socket.to(`room-${data.roomId}`).emit('player-left', data);
  });

  // Игра началась
  socket.on('game-started', (data) => {
    io.to(`room-${data.roomId}`).emit('game-started', data);
  });

  // Новый раунд начался
  socket.on('round-started', (data) => {
    io.to(`game-${data.gameId}`).emit('round-started', data);
  });

  // Раунд завершён
  socket.on('round-ended', (data) => {
    io.to(`game-${data.gameId}`).emit('round-ended', data);
  });

  // Игра завершена
  socket.on('game-ended', (data) => {
    io.to(`game-${data.gameId}`).emit('game-ended', data);
  });

  // Новый ответ от игрока
  socket.on('answer-submitted', (data) => {
    socket.to(`game-${data.gameId}`).emit('answer-submitted', {
      playerId: data.playerId,
      isCorrect: data.isCorrect,
      responseTime: data.responseTime
    });
  });

  // Обновление счёта в реальном времени
  socket.on('score-updated', (data) => {
    io.to(`game-${data.gameId}`).emit('score-updated', data);
  });

  // Отключение
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Очищаем из всех комнат и игр
    for (const [roomId, sockets] of activeRooms.entries()) {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          activeRooms.delete(roomId);
        }
      }
    }
    
    for (const [gameId, sockets] of activeGames.entries()) {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          activeGames.delete(gameId);
        }
      }
    }
  });
});

// Вспомогательные функции для Socket.IO
const emitToRoom = (roomId, event, data) => {
  io.to(`room-${roomId}`).emit(event, data);
};

const emitToGame = (gameId, event, data) => {
  io.to(`game-${gameId}`).emit(event, data);
};

// Экспорт функций для использования в контроллерах
global.socketEmitters = {
  emitToRoom,
  emitToGame
};

// Периодическая очистка кэша игр (каждые 30 минут)
cron.schedule('*/30 * * * *', () => {
  console.log('Running cache cleanup...');
  gameService.cleanupCache();
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message 
  });
});

// 404 обработчик
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Запуск сервера
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = { app, server, io };