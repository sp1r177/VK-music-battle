const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  responseTime: {
    type: Number, // в секундах
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

const roundSchema = new mongoose.Schema({
  roundNumber: {
    type: Number,
    required: true
  },
  track: {
    id: String,
    title: String,
    artist: String,
    duration: Number,
    url: String,
    preview_url: String
  },
  correctAnswer: {
    type: String,
    required: true
  },
  alternativeAnswers: [String], // возможные варианты правильного ответа
  startTime: {
    type: Date,
    required: true
  },
  endTime: Date,
  timeLimit: {
    type: Number,
    default: 30 // секунды
  },
  answers: [answerSchema],
  status: {
    type: String,
    enum: ['waiting', 'playing', 'finished'],
    default: 'waiting'
  }
});

const gameSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  players: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    totalScore: {
      type: Number,
      default: 0
    },
    correctAnswers: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0
    },
    position: Number // финальная позиция в игре
  }],
  rounds: [roundSchema],
  currentRound: {
    type: Number,
    default: 0
  },
  settings: {
    roundsCount: Number,
    roundTime: Number,
    difficulty: String
  },
  status: {
    type: String,
    enum: ['preparing', 'playing', 'finished'],
    default: 'preparing'
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  startedAt: Date,
  finishedAt: Date
}, {
  timestamps: true
});

// Методы для подсчёта очков
gameSchema.methods.calculateScore = function(responseTime, timeLimit, isCorrect) {
  if (!isCorrect) return 0;
  
  const baseScore = 100;
  const timeBonus = Math.max(0, (timeLimit - responseTime) / timeLimit);
  return Math.round(baseScore * (0.5 + 0.5 * timeBonus));
};

gameSchema.methods.updatePlayerStats = function() {
  this.players.forEach(player => {
    const playerAnswers = [];
    
    this.rounds.forEach(round => {
      const answer = round.answers.find(a => a.player.toString() === player.user.toString());
      if (answer) {
        playerAnswers.push(answer);
      }
    });
    
    player.totalScore = playerAnswers.reduce((sum, answer) => sum + answer.score, 0);
    player.correctAnswers = playerAnswers.filter(answer => answer.isCorrect).length;
    
    const responseTimes = playerAnswers.map(answer => answer.responseTime);
    player.averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;
  });
  
  // Сортируем игроков по очкам для определения позиций
  this.players.sort((a, b) => b.totalScore - a.totalScore);
  this.players.forEach((player, index) => {
    player.position = index + 1;
  });
  
  // Определяем победителя
  if (this.players.length > 0) {
    this.winner = this.players[0].user;
  }
};

gameSchema.methods.getCurrentRound = function() {
  return this.rounds[this.currentRound];
};

gameSchema.methods.addAnswer = function(roundNumber, playerId, answer, responseTime) {
  const round = this.rounds[roundNumber];
  if (!round || round.status !== 'playing') return false;
  
  // Проверяем, не отвечал ли уже игрок в этом раунде
  const existingAnswer = round.answers.find(a => a.player.toString() === playerId.toString());
  if (existingAnswer) return false;
  
  const isCorrect = this.checkAnswer(answer, round.correctAnswer, round.alternativeAnswers);
  const score = this.calculateScore(responseTime, round.timeLimit, isCorrect);
  
  round.answers.push({
    player: playerId,
    answer,
    isCorrect,
    responseTime,
    score
  });
  
  return true;
};

gameSchema.methods.checkAnswer = function(userAnswer, correctAnswer, alternatives = []) {
  const normalize = (str) => str.toLowerCase().trim().replace(/[^\w\s]/g, '');
  
  const normalizedUserAnswer = normalize(userAnswer);
  const normalizedCorrect = normalize(correctAnswer);
  
  if (normalizedUserAnswer === normalizedCorrect) return true;
  
  return alternatives.some(alt => normalize(alt) === normalizedUserAnswer);
};

module.exports = mongoose.model('Game', gameSchema);