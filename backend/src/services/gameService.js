const Game = require('../models/Game');
const Room = require('../models/Room');
const User = require('../models/User');
const vkService = require('./vkService');

class GameService {
  constructor() {
    this.activeGames = new Map(); // Кэш активных игр
  }

  // Создание новой игры
  async createGame(roomId) {
    try {
      const room = await Room.findById(roomId).populate('players.user');
      if (!room) {
        throw new Error('Room not found');
      }

      if (room.status !== 'waiting' || !room.allPlayersReady()) {
        throw new Error('Room is not ready for game');
      }

      const game = new Game({
        room: roomId,
        players: room.players.map(p => ({
          user: p.user._id,
          totalScore: 0,
          correctAnswers: 0,
          averageResponseTime: 0
        })),
        settings: {
          roundsCount: room.settings.roundsCount,
          roundTime: room.settings.roundTime,
          difficulty: room.settings.difficulty
        },
        status: 'preparing'
      });

      await game.save();
      
      // Обновляем статус комнаты
      room.status = 'playing';
      room.currentGame = game._id;
      await room.save();

      // Генерируем раунды
      await this.generateRounds(game);

      this.activeGames.set(game._id.toString(), game);
      return game;
    } catch (error) {
      console.error('Error creating game:', error);
      throw error;
    }
  }

  // Генерация раундов для игры
  async generateRounds(game) {
    try {
      const rounds = [];
      
      for (let i = 0; i < game.settings.roundsCount; i++) {
        const track = await vkService.getRandomTrackForGame(game.settings.difficulty);
        
        if (!track) {
          throw new Error('Failed to get track for round');
        }

        const round = {
          roundNumber: i,
          track: {
            id: track.id,
            title: track.title,
            artist: track.artist,
            duration: track.duration,
            url: track.url,
            preview_url: track.preview_url
          },
          correctAnswer: `${track.artist} - ${track.title}`,
          alternativeAnswers: [
            track.title,
            track.artist,
            `${track.title} - ${track.artist}`,
            track.title.toLowerCase(),
            track.artist.toLowerCase()
          ],
          startTime: new Date(),
          timeLimit: game.settings.roundTime,
          answers: [],
          status: 'waiting'
        };

        rounds.push(round);
      }

      game.rounds = rounds;
      await game.save();
      
      return rounds;
    } catch (error) {
      console.error('Error generating rounds:', error);
      throw error;
    }
  }

  // Начало игры
  async startGame(gameId) {
    try {
      const game = await this.getGame(gameId);
      if (!game) {
        throw new Error('Game not found');
      }

      game.status = 'playing';
      game.startedAt = new Date();
      game.currentRound = 0;

      await game.save();
      await this.startRound(gameId, 0);

      return game;
    } catch (error) {
      console.error('Error starting game:', error);
      throw error;
    }
  }

  // Начало раунда
  async startRound(gameId, roundNumber) {
    try {
      const game = await this.getGame(gameId);
      if (!game || !game.rounds[roundNumber]) {
        throw new Error('Game or round not found');
      }

      const round = game.rounds[roundNumber];
      round.status = 'playing';
      round.startTime = new Date();

      await game.save();

      // Автоматическое завершение раунда по истечении времени
      setTimeout(async () => {
        await this.endRound(gameId, roundNumber);
      }, round.timeLimit * 1000);

      return round;
    } catch (error) {
      console.error('Error starting round:', error);
      throw error;
    }
  }

  // Завершение раунда
  async endRound(gameId, roundNumber) {
    try {
      const game = await this.getGame(gameId);
      if (!game || !game.rounds[roundNumber]) {
        return;
      }

      const round = game.rounds[roundNumber];
      if (round.status !== 'playing') {
        return;
      }

      round.status = 'finished';
      round.endTime = new Date();

      await game.save();

      // Проверяем, есть ли ещё раунды
      if (roundNumber + 1 < game.rounds.length) {
        // Переходим к следующему раунду через 3 секунды
        setTimeout(async () => {
          game.currentRound = roundNumber + 1;
          await game.save();
          await this.startRound(gameId, roundNumber + 1);
        }, 3000);
      } else {
        // Игра завершена
        await this.endGame(gameId);
      }

      return round;
    } catch (error) {
      console.error('Error ending round:', error);
      throw error;
    }
  }

  // Завершение игры
  async endGame(gameId) {
    try {
      const game = await this.getGame(gameId);
      if (!game) {
        return;
      }

      game.status = 'finished';
      game.finishedAt = new Date();
      
      // Обновляем статистику игроков
      game.updatePlayerStats();
      await game.save();

      // Обновляем статистику пользователей в базе данных
      await this.updateUserStats(game);

      // Обновляем статус комнаты
      const room = await Room.findById(game.room);
      if (room) {
        room.status = 'finished';
        await room.save();
      }

      // Удаляем игру из кэша
      this.activeGames.delete(gameId.toString());

      return game;
    } catch (error) {
      console.error('Error ending game:', error);
      throw error;
    }
  }

  // Обновление статистики пользователей
  async updateUserStats(game) {
    try {
      for (const player of game.players) {
        const user = await User.findById(player.user);
        if (!user) continue;

        user.gamesPlayed += 1;
        user.totalScore += player.totalScore;
        user.correctAnswers += player.correctAnswers;
        user.totalAnswers += game.rounds.length;

        if (player.position === 1) {
          user.gamesWon += 1;
          user.streak.current += 1;
          if (user.streak.current > user.streak.best) {
            user.streak.best = user.streak.current;
          }
        } else {
          user.streak.current = 0;
        }

        // Обновляем среднее время ответа
        const totalResponseTime = user.averageResponseTime * (user.gamesPlayed - 1) + player.averageResponseTime;
        user.averageResponseTime = totalResponseTime / user.gamesPlayed;

        user.lastActive = new Date();
        await user.save();
      }
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }

  // Добавление ответа игрока
  async submitAnswer(gameId, roundNumber, userId, answer) {
    try {
      const game = await this.getGame(gameId);
      if (!game) {
        throw new Error('Game not found');
      }

      const round = game.rounds[roundNumber];
      if (!round || round.status !== 'playing') {
        throw new Error('Round is not active');
      }

      // Вычисляем время ответа
      const responseTime = (new Date() - round.startTime) / 1000;
      if (responseTime > round.timeLimit) {
        throw new Error('Time limit exceeded');
      }

      // Добавляем ответ
      const success = game.addAnswer(roundNumber, userId, answer, responseTime);
      if (!success) {
        throw new Error('Failed to add answer');
      }

      await game.save();

      // Проверяем, все ли игроки ответили
      const totalPlayers = game.players.length;
      const answeredPlayers = round.answers.length;
      
      if (answeredPlayers === totalPlayers) {
        // Все ответили, завершаем раунд досрочно
        await this.endRound(gameId, roundNumber);
      }

      return {
        success: true,
        isCorrect: round.answers[round.answers.length - 1].isCorrect,
        score: round.answers[round.answers.length - 1].score,
        responseTime
      };
    } catch (error) {
      console.error('Error submitting answer:', error);
      throw error;
    }
  }

  // Получение игры
  async getGame(gameId) {
    try {
      // Сначала проверяем кэш
      if (this.activeGames.has(gameId.toString())) {
        return this.activeGames.get(gameId.toString());
      }

      // Загружаем из базы данных
      const game = await Game.findById(gameId).populate('players.user room');
      if (game && game.status !== 'finished') {
        this.activeGames.set(gameId.toString(), game);
      }

      return game;
    } catch (error) {
      console.error('Error getting game:', error);
      return null;
    }
  }

  // Получение текущего раунда
  async getCurrentRound(gameId) {
    try {
      const game = await this.getGame(gameId);
      if (!game) {
        return null;
      }

      return game.getCurrentRound();
    } catch (error) {
      console.error('Error getting current round:', error);
      return null;
    }
  }

  // Получение результатов игры
  async getGameResults(gameId) {
    try {
      const game = await Game.findById(gameId)
        .populate('players.user', 'firstName lastName photo vkId')
        .populate('winner', 'firstName lastName photo vkId');

      if (!game) {
        throw new Error('Game not found');
      }

      return {
        game,
        leaderboard: game.players.sort((a, b) => b.totalScore - a.totalScore),
        rounds: game.rounds.map(round => ({
          roundNumber: round.roundNumber,
          track: round.track,
          correctAnswer: round.correctAnswer,
          answers: round.answers.length,
          fastestAnswer: round.answers.length > 0 
            ? Math.min(...round.answers.map(a => a.responseTime))
            : null
        }))
      };
    } catch (error) {
      console.error('Error getting game results:', error);
      throw error;
    }
  }

  // Получение лидерборда
  async getLeaderboard(limit = 10) {
    try {
      const users = await User.find()
        .sort({ totalScore: -1 })
        .limit(limit)
        .select('firstName lastName photo vkId totalScore gamesPlayed gamesWon streak');

      return users.map((user, index) => ({
        position: index + 1,
        user,
        stats: {
          totalScore: user.totalScore,
          gamesPlayed: user.gamesPlayed,
          winRate: user.winRate,
          streak: user.streak.best
        }
      }));
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  // Очистка старых игр из кэша
  cleanupCache() {
    const now = new Date();
    const expiredGames = [];

    for (const [gameId, game] of this.activeGames.entries()) {
      const timeDiff = now - game.updatedAt;
      if (timeDiff > 30 * 60 * 1000) { // 30 минут
        expiredGames.push(gameId);
      }
    }

    expiredGames.forEach(gameId => {
      this.activeGames.delete(gameId);
    });

    console.log(`Cleaned up ${expiredGames.length} expired games from cache`);
  }
}

module.exports = new GameService();