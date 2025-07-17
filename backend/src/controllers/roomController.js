const Room = require('../models/Room');
const User = require('../models/User');
const vkService = require('../services/vkService');

const roomController = {
  // Создание новой комнаты
  async createRoom(req, res) {
    try {
      const { name, settings = {} } = req.body;
      const hostId = req.user.id;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Room name is required' });
      }

      const room = new Room({
        name: name.trim(),
        host: hostId,
        players: [{ user: hostId, isReady: false }],
        settings: {
          maxPlayers: settings.maxPlayers || 6,
          roundsCount: settings.roundsCount || 5,
          roundTime: settings.roundTime || 30,
          difficulty: settings.difficulty || 'medium',
          isPrivate: settings.isPrivate || false
        }
      });

      await room.save();
      await room.populate('players.user', 'firstName lastName photo vkId');

      // Создаём ссылку для приглашения
      const inviteUrl = `${process.env.FRONTEND_URL}/room/${room.code}`;
      room.inviteLink = vkService.createShareLink(
        inviteUrl,
        `Присоединяйся к музыкальному баттлу "${room.name}"!`
      );
      await room.save();

      res.status(201).json({
        success: true,
        room: {
          id: room._id,
          code: room.code,
          name: room.name,
          host: room.host,
          players: room.players,
          settings: room.settings,
          status: room.status,
          inviteLink: room.inviteLink,
          createdAt: room.createdAt
        }
      });
    } catch (error) {
      console.error('Create room error:', error);
      res.status(500).json({ error: 'Failed to create room' });
    }
  },

  // Присоединение к комнате по коду
  async joinRoom(req, res) {
    try {
      const { code } = req.params;
      const userId = req.user.id;

      const room = await Room.findOne({ code: code.toUpperCase() })
        .populate('players.user', 'firstName lastName photo vkId');

      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      if (room.status !== 'waiting') {
        return res.status(400).json({ error: 'Cannot join room - game in progress' });
      }

      // Проверяем, не находится ли пользователь уже в комнате
      const existingPlayer = room.players.find(
        p => p.user._id.toString() === userId.toString()
      );

      if (existingPlayer) {
        return res.json({
          success: true,
          room: {
            id: room._id,
            code: room.code,
            name: room.name,
            host: room.host,
            players: room.players,
            settings: room.settings,
            status: room.status,
            inviteLink: room.inviteLink
          },
          message: 'Already in room'
        });
      }

      if (room.players.length >= room.settings.maxPlayers) {
        return res.status(400).json({ error: 'Room is full' });
      }

      // Добавляем игрока в комнату
      const success = room.addPlayer(userId);
      if (!success) {
        return res.status(400).json({ error: 'Failed to join room' });
      }

      await room.save();
      await room.populate('players.user', 'firstName lastName photo vkId');

      res.json({
        success: true,
        room: {
          id: room._id,
          code: room.code,
          name: room.name,
          host: room.host,
          players: room.players,
          settings: room.settings,
          status: room.status,
          inviteLink: room.inviteLink
        }
      });
    } catch (error) {
      console.error('Join room error:', error);
      res.status(500).json({ error: 'Failed to join room' });
    }
  },

  // Покидание комнаты
  async leaveRoom(req, res) {
    try {
      const { roomId } = req.params;
      const userId = req.user.id;

      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      // Проверяем, находится ли пользователь в комнате
      const playerIndex = room.players.findIndex(
        p => p.user.toString() === userId.toString()
      );

      if (playerIndex === -1) {
        return res.status(400).json({ error: 'Not in this room' });
      }

      // Если это хост и в комнате есть другие игроки, передаём права хоста
      if (room.isHost(userId) && room.players.length > 1) {
        const newHost = room.players.find(p => p.user.toString() !== userId.toString());
        room.host = newHost.user;
      }

      // Удаляем игрока из комнаты
      room.removePlayer(userId);

      // Если комната пуста, удаляем её
      if (room.players.length === 0) {
        await Room.findByIdAndDelete(roomId);
        return res.json({ success: true, message: 'Room deleted' });
      }

      await room.save();

      res.json({ success: true, message: 'Left room successfully' });
    } catch (error) {
      console.error('Leave room error:', error);
      res.status(500).json({ error: 'Failed to leave room' });
    }
  },

  // Изменение готовности игрока
  async toggleReady(req, res) {
    try {
      const { roomId } = req.params;
      const userId = req.user.id;

      const room = await Room.findById(roomId)
        .populate('players.user', 'firstName lastName photo vkId');

      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      const player = room.players.find(
        p => p.user._id.toString() === userId.toString()
      );

      if (!player) {
        return res.status(400).json({ error: 'Not in this room' });
      }

      player.isReady = !player.isReady;
      await room.save();

      res.json({
        success: true,
        room: {
          id: room._id,
          code: room.code,
          name: room.name,
          host: room.host,
          players: room.players,
          settings: room.settings,
          status: room.status,
          allReady: room.allPlayersReady()
        }
      });
    } catch (error) {
      console.error('Toggle ready error:', error);
      res.status(500).json({ error: 'Failed to toggle ready status' });
    }
  },

  // Обновление настроек комнаты (только хост)
  async updateSettings(req, res) {
    try {
      const { roomId } = req.params;
      const userId = req.user.id;
      const { settings } = req.body;

      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      if (!room.isHost(userId)) {
        return res.status(403).json({ error: 'Only host can update settings' });
      }

      if (room.status !== 'waiting') {
        return res.status(400).json({ error: 'Cannot update settings - game in progress' });
      }

      // Обновляем настройки
      if (settings.maxPlayers) {
        room.settings.maxPlayers = Math.max(2, Math.min(10, settings.maxPlayers));
      }
      if (settings.roundsCount) {
        room.settings.roundsCount = Math.max(3, Math.min(10, settings.roundsCount));
      }
      if (settings.roundTime) {
        room.settings.roundTime = Math.max(15, Math.min(60, settings.roundTime));
      }
      if (settings.difficulty) {
        room.settings.difficulty = ['easy', 'medium', 'hard'].includes(settings.difficulty) 
          ? settings.difficulty 
          : 'medium';
      }
      if (typeof settings.isPrivate === 'boolean') {
        room.settings.isPrivate = settings.isPrivate;
      }

      await room.save();

      res.json({
        success: true,
        settings: room.settings
      });
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  },

  // Получение информации о комнате
  async getRoomInfo(req, res) {
    try {
      const { roomId } = req.params;

      const room = await Room.findById(roomId)
        .populate('players.user', 'firstName lastName photo vkId')
        .populate('host', 'firstName lastName photo vkId');

      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      res.json({
        success: true,
        room: {
          id: room._id,
          code: room.code,
          name: room.name,
          host: room.host,
          players: room.players,
          settings: room.settings,
          status: room.status,
          inviteLink: room.inviteLink,
          currentGame: room.currentGame,
          createdAt: room.createdAt
        }
      });
    } catch (error) {
      console.error('Get room info error:', error);
      res.status(500).json({ error: 'Failed to get room info' });
    }
  },

  // Получение списка публичных комнат
  async getPublicRooms(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      
      const rooms = await Room.find({
        'settings.isPrivate': false,
        status: 'waiting'
      })
        .populate('host', 'firstName lastName photo')
        .populate('players.user', 'firstName lastName photo')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Room.countDocuments({
        'settings.isPrivate': false,
        status: 'waiting'
      });

      res.json({
        success: true,
        rooms: rooms.map(room => ({
          id: room._id,
          code: room.code,
          name: room.name,
          host: room.host,
          playersCount: room.players.length,
          maxPlayers: room.settings.maxPlayers,
          settings: room.settings,
          createdAt: room.createdAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get public rooms error:', error);
      res.status(500).json({ error: 'Failed to get public rooms' });
    }
  },

  // Удаление комнаты (только хост)
  async deleteRoom(req, res) {
    try {
      const { roomId } = req.params;
      const userId = req.user.id;

      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      if (!room.isHost(userId)) {
        return res.status(403).json({ error: 'Only host can delete room' });
      }

      await Room.findByIdAndDelete(roomId);

      res.json({ success: true, message: 'Room deleted successfully' });
    } catch (error) {
      console.error('Delete room error:', error);
      res.status(500).json({ error: 'Failed to delete room' });
    }
  }
};

module.exports = roomController;