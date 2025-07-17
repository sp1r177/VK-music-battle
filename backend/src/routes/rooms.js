const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const authMiddleware = require('../middleware/auth');

// Все маршруты требуют авторизации
router.use(authMiddleware);

// Создание комнаты
router.post('/', roomController.createRoom);

// Получение списка публичных комнат
router.get('/public', roomController.getPublicRooms);

// Присоединение к комнате по коду
router.post('/join/:code', roomController.joinRoom);

// Получение информации о комнате
router.get('/:roomId', roomController.getRoomInfo);

// Покидание комнаты
router.post('/:roomId/leave', roomController.leaveRoom);

// Изменение готовности
router.post('/:roomId/ready', roomController.toggleReady);

// Обновление настроек комнаты (только хост)
router.put('/:roomId/settings', roomController.updateSettings);

// Удаление комнаты (только хост)
router.delete('/:roomId', roomController.deleteRoom);

module.exports = router;