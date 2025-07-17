const User = require('../models/User');
const vkService = require('../services/vkService');
const jwt = require('jsonwebtoken');

const authController = {
  // Авторизация через VK
  async vkAuth(req, res) {
    try {
      const { vkUserId, authKey } = req.body;

      if (!vkUserId) {
        return res.status(400).json({ error: 'VK User ID is required' });
      }

      // В реальном приложении здесь должна быть проверка authKey
      // через VK Bridge или VK API для безопасности

      // Получаем информацию о пользователе из VK
      const vkUserInfo = await vkService.getUserInfo(vkUserId);
      
      if (!vkUserInfo) {
        return res.status(400).json({ error: 'Invalid VK User ID' });
      }

      // Ищем пользователя в базе данных
      let user = await User.findOne({ vkId: vkUserId });

      if (!user) {
        // Создаём нового пользователя
        user = new User({
          vkId: vkUserId,
          firstName: vkUserInfo.first_name,
          lastName: vkUserInfo.last_name,
          photo: vkUserInfo.photo_100 || ''
        });
        await user.save();
      } else {
        // Обновляем информацию существующего пользователя
        user.firstName = vkUserInfo.first_name;
        user.lastName = vkUserInfo.last_name;
        user.photo = vkUserInfo.photo_100 || user.photo;
        user.lastActive = new Date();
        await user.save();
      }

      // Генерируем JWT токен
      const token = jwt.sign(
        { userId: user._id, vkId: user.vkId },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          vkId: user.vkId,
          firstName: user.firstName,
          lastName: user.lastName,
          photo: user.photo,
          totalScore: user.totalScore,
          gamesPlayed: user.gamesPlayed,
          winRate: user.winRate,
          streak: user.streak
        }
      });
    } catch (error) {
      console.error('VK Auth error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  },

  // Проверка токена
  async verifyToken(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      res.json({
        success: true,
        user: {
          id: user._id,
          vkId: user.vkId,
          firstName: user.firstName,
          lastName: user.lastName,
          photo: user.photo,
          totalScore: user.totalScore,
          gamesPlayed: user.gamesPlayed,
          winRate: user.winRate,
          streak: user.streak
        }
      });
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({ error: 'Invalid token' });
    }
  },

  // Обновление профиля пользователя
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const updates = req.body;

      // Разрешённые поля для обновления
      const allowedUpdates = ['firstName', 'lastName'];
      const filteredUpdates = {};

      Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key)) {
          filteredUpdates[key] = updates[key];
        }
      });

      const user = await User.findByIdAndUpdate(
        userId,
        { ...filteredUpdates, lastActive: new Date() },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        success: true,
        user: {
          id: user._id,
          vkId: user.vkId,
          firstName: user.firstName,
          lastName: user.lastName,
          photo: user.photo,
          totalScore: user.totalScore,
          gamesPlayed: user.gamesPlayed,
          winRate: user.winRate,
          streak: user.streak
        }
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  },

  // Получение статистики пользователя
  async getUserStats(req, res) {
    try {
      const userId = req.params.userId || req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        success: true,
        stats: {
          totalScore: user.totalScore,
          gamesPlayed: user.gamesPlayed,
          gamesWon: user.gamesWon,
          winRate: user.winRate,
          accuracy: user.accuracy,
          averageResponseTime: user.averageResponseTime,
          streak: user.streak,
          achievements: user.achievements,
          correctAnswers: user.correctAnswers,
          totalAnswers: user.totalAnswers
        }
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({ error: 'Failed to get user stats' });
    }
  }
};

module.exports = authController;