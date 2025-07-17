const gameService = require('../services/gameService');
const Room = require('../models/Room');

const gameController = {
  // Начало игры (только хост)
  async startGame(req, res) {
    try {
      const { roomId } = req.params;
      const userId = req.user.id;

      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      if (!room.isHost(userId)) {
        return res.status(403).json({ error: 'Only host can start the game' });
      }

      if (!room.allPlayersReady()) {
        return res.status(400).json({ error: 'Not all players are ready' });
      }

      const game = await gameService.createGame(roomId);
      await gameService.startGame(game._id);

      res.json({
        success: true,
        game: {
          id: game._id,
          status: game.status,
          currentRound: game.currentRound,
          settings: game.settings,
          players: game.players
        }
      });
    } catch (error) {
      console.error('Start game error:', error);
      res.status(500).json({ error: error.message || 'Failed to start game' });
    }
  },

  // Получение информации об игре
  async getGameInfo(req, res) {
    try {
      const { gameId } = req.params;
      
      const game = await gameService.getGame(gameId);
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      // Проверяем, что пользователь участвует в игре
      const isPlayer = game.players.some(
        p => p.user.toString() === req.user.id.toString()
      );

      if (!isPlayer) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({
        success: true,
        game: {
          id: game._id,
          status: game.status,
          currentRound: game.currentRound,
          totalRounds: game.rounds.length,
          settings: game.settings,
          players: game.players.map(p => ({
            user: p.user,
            totalScore: p.totalScore,
            correctAnswers: p.correctAnswers,
            averageResponseTime: p.averageResponseTime,
            position: p.position
          })),
          startedAt: game.startedAt,
          finishedAt: game.finishedAt
        }
      });
    } catch (error) {
      console.error('Get game info error:', error);
      res.status(500).json({ error: 'Failed to get game info' });
    }
  },

  // Получение текущего раунда
  async getCurrentRound(req, res) {
    try {
      const { gameId } = req.params;
      
      const game = await gameService.getGame(gameId);
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      // Проверяем, что пользователь участвует в игре
      const isPlayer = game.players.some(
        p => p.user.toString() === req.user.id.toString()
      );

      if (!isPlayer) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const currentRound = game.getCurrentRound();
      if (!currentRound) {
        return res.status(404).json({ error: 'No active round' });
      }

      // Не отправляем правильный ответ во время игры
      const roundData = {
        roundNumber: currentRound.roundNumber,
        track: {
          id: currentRound.track.id,
          duration: currentRound.track.duration,
          preview_url: currentRound.track.preview_url
        },
        startTime: currentRound.startTime,
        timeLimit: currentRound.timeLimit,
        status: currentRound.status,
        answersCount: currentRound.answers.length,
        totalPlayers: game.players.length
      };

      // Если раунд завершён, показываем правильный ответ и результаты
      if (currentRound.status === 'finished') {
        roundData.correctAnswer = currentRound.correctAnswer;
        roundData.track.title = currentRound.track.title;
        roundData.track.artist = currentRound.track.artist;
        roundData.answers = currentRound.answers.map(answer => ({
          player: answer.player,
          answer: answer.answer,
          isCorrect: answer.isCorrect,
          responseTime: answer.responseTime,
          score: answer.score
        }));
      }

      res.json({
        success: true,
        round: roundData
      });
    } catch (error) {
      console.error('Get current round error:', error);
      res.status(500).json({ error: 'Failed to get current round' });
    }
  },

  // Отправка ответа
  async submitAnswer(req, res) {
    try {
      const { gameId } = req.params;
      const { answer } = req.body;
      const userId = req.user.id;

      if (!answer || answer.trim().length === 0) {
        return res.status(400).json({ error: 'Answer is required' });
      }

      const game = await gameService.getGame(gameId);
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      const result = await gameService.submitAnswer(
        gameId,
        game.currentRound,
        userId,
        answer.trim()
      );

      res.json({
        success: true,
        result: {
          isCorrect: result.isCorrect,
          score: result.score,
          responseTime: result.responseTime
        }
      });
    } catch (error) {
      console.error('Submit answer error:', error);
      res.status(400).json({ error: error.message || 'Failed to submit answer' });
    }
  },

  // Получение результатов игры
  async getGameResults(req, res) {
    try {
      const { gameId } = req.params;
      
      const results = await gameService.getGameResults(gameId);
      
      // Проверяем, что пользователь участвовал в игре
      const isPlayer = results.game.players.some(
        p => p.user._id.toString() === req.user.id.toString()
      );

      if (!isPlayer) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({
        success: true,
        results: {
          game: {
            id: results.game._id,
            status: results.game.status,
            winner: results.game.winner,
            startedAt: results.game.startedAt,
            finishedAt: results.game.finishedAt,
            settings: results.game.settings
          },
          leaderboard: results.leaderboard.map((player, index) => ({
            position: index + 1,
            user: player.user,
            totalScore: player.totalScore,
            correctAnswers: player.correctAnswers,
            averageResponseTime: player.averageResponseTime
          })),
          rounds: results.rounds
        }
      });
    } catch (error) {
      console.error('Get game results error:', error);
      res.status(500).json({ error: 'Failed to get game results' });
    }
  },

  // Получение глобального лидерборда
  async getLeaderboard(req, res) {
    try {
      const { limit = 10 } = req.query;
      
      const leaderboard = await gameService.getLeaderboard(parseInt(limit));
      
      res.json({
        success: true,
        leaderboard
      });
    } catch (error) {
      console.error('Get leaderboard error:', error);
      res.status(500).json({ error: 'Failed to get leaderboard' });
    }
  },

  // Получение истории игр пользователя
  async getUserGameHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;

      const Game = require('../models/Game');
      
      const games = await Game.find({
        'players.user': userId,
        status: 'finished'
      })
        .populate('players.user', 'firstName lastName photo')
        .populate('winner', 'firstName lastName photo')
        .sort({ finishedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Game.countDocuments({
        'players.user': userId,
        status: 'finished'
      });

      const gameHistory = games.map(game => {
        const userPlayer = game.players.find(
          p => p.user._id.toString() === userId.toString()
        );
        
        return {
          id: game._id,
          finishedAt: game.finishedAt,
          playerPosition: userPlayer ? userPlayer.position : null,
          playerScore: userPlayer ? userPlayer.totalScore : 0,
          totalPlayers: game.players.length,
          winner: game.winner,
          roundsCount: game.rounds.length,
          settings: game.settings
        };
      });

      res.json({
        success: true,
        games: gameHistory,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get user game history error:', error);
      res.status(500).json({ error: 'Failed to get game history' });
    }
  }
};

module.exports = gameController;