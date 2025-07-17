const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const authMiddleware = require('../middleware/auth');

// Все маршруты требуют авторизации
router.use(authMiddleware);

// Начало игры в комнате
router.post('/start/:roomId', gameController.startGame);

// Получение информации об игре
router.get('/:gameId', gameController.getGameInfo);

// Получение текущего раунда
router.get('/:gameId/round', gameController.getCurrentRound);

// Отправка ответа
router.post('/:gameId/answer', gameController.submitAnswer);

// Получение результатов игры
router.get('/:gameId/results', gameController.getGameResults);

// Получение глобального лидерборда
router.get('/leaderboard/global', gameController.getLeaderboard);

// Получение истории игр пользователя
router.get('/history/user', gameController.getUserGameHistory);

module.exports = router;