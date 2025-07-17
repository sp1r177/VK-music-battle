const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  vkId: {
    type: Number,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  photo: {
    type: String,
    default: ''
  },
  totalScore: {
    type: Number,
    default: 0
  },
  gamesPlayed: {
    type: Number,
    default: 0
  },
  gamesWon: {
    type: Number,
    default: 0
  },
  averageResponseTime: {
    type: Number,
    default: 0
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  totalAnswers: {
    type: Number,
    default: 0
  },
  streak: {
    current: {
      type: Number,
      default: 0
    },
    best: {
      type: Number,
      default: 0
    }
  },
  achievements: [{
    type: String,
    enum: ['first_win', 'speed_demon', 'music_expert', 'social_butterfly', 'consistency_king']
  }],
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Вычисляемые поля
userSchema.virtual('winRate').get(function() {
  return this.gamesPlayed > 0 ? (this.gamesWon / this.gamesPlayed * 100).toFixed(1) : 0;
});

userSchema.virtual('accuracy').get(function() {
  return this.totalAnswers > 0 ? (this.correctAnswers / this.totalAnswers * 100).toFixed(1) : 0;
});

// Индексы для производительности
userSchema.index({ totalScore: -1 });
userSchema.index({ vkId: 1 });

module.exports = mongoose.model('User', userSchema);