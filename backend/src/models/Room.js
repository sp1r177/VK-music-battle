const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    maxlength: 50
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  players: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isReady: {
      type: Boolean,
      default: false
    }
  }],
  settings: {
    maxPlayers: {
      type: Number,
      default: 6,
      min: 2,
      max: 10
    },
    roundsCount: {
      type: Number,
      default: 5,
      min: 3,
      max: 10
    },
    roundTime: {
      type: Number,
      default: 30, // секунды
      min: 15,
      max: 60
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    isPrivate: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: ['waiting', 'starting', 'playing', 'finished'],
    default: 'waiting'
  },
  currentGame: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    default: null
  },
  inviteLink: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Генерация уникального кода комнаты
roomSchema.pre('save', async function(next) {
  if (this.isNew && !this.code) {
    let code;
    let exists = true;
    
    while (exists) {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      exists = await this.constructor.findOne({ code });
    }
    
    this.code = code;
  }
  next();
});

// Методы
roomSchema.methods.addPlayer = function(userId) {
  const existingPlayer = this.players.find(p => p.user.toString() === userId.toString());
  if (!existingPlayer && this.players.length < this.settings.maxPlayers) {
    this.players.push({ user: userId });
    return true;
  }
  return false;
};

roomSchema.methods.removePlayer = function(userId) {
  this.players = this.players.filter(p => p.user.toString() !== userId.toString());
};

roomSchema.methods.isHost = function(userId) {
  return this.host.toString() === userId.toString();
};

roomSchema.methods.allPlayersReady = function() {
  return this.players.length >= 2 && this.players.every(p => p.isReady);
};

// Автоматическое удаление комнат через 24 часа
roomSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('Room', roomSchema);