const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  gameType: {
    type: String,
    enum: ['MINES', 'PLINKO', 'DICE', 'ROULETTE', 'BLACKJACK', 'COINFLIP'],
    required: true
  },
  betAmount: {
    type: Number,
    required: true,
    min: 0
  },
  multiplier: {
    type: Number,
    default: 1.0
  },
  payout: {
    type: Number,
    default: 0
  },
  // Game-specific state (e.g., mine locations, deck of cards)
  state: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // If the game needs multiple steps (like Mines/Blackjack), this is true
  isActive: {
    type: Boolean,
    default: true
  },
  clientSeed: {
    type: String,
    default: ''
  },
  serverSeed: {
    type: String,
    default: ''
  },
  nonce: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GameSession', gameSessionSchema);
