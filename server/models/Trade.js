const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  marketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Market',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  outcomeIndex: {
    type: Number,
    required: true,
    min: 0,
  },
  sharesDelta: {
    type: Number,
    required: true,
  },
  cost: {
    type: Number,
    required: true,
  },
  qBefore: {
    type: [Number],
    required: true,
  },
  qAfter: {
    type: [Number],
    required: true,
  },
  probabilitiesBefore: {
    type: [Number],
    required: true,
  },
  probabilitiesAfter: {
    type: [Number],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Trade', tradeSchema);

