const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Авторизация через VK
router.post('/vk', authController.vkAuth);

// Проверка токена
router.get('/verify', authController.verifyToken);

// Обновление профиля (требует авторизации)
router.put('/profile', authMiddleware, authController.updateProfile);

// Получение статистики пользователя
router.get('/stats/:userId?', authMiddleware, authController.getUserStats);

module.exports = router;