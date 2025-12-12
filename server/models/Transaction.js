const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['initial', 'trade', 'settlement', 'admin_grant'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  marketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Market',
    default: null,
  },
  tradeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trade',
    default: null,
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Transaction', transactionSchema);

