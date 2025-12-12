const mongoose = require('mongoose');

const marketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  outcomes: {
    type: [String],
    required: true,
    validate: {
      validator: (v) => v.length >= 2,
      message: 'Market must have at least 2 outcomes',
    },
  },
  q: {
    type: [Number],
    required: true,
    default: function() {
      return new Array(this.outcomes.length).fill(0);
    },
  },
  b: {
    type: Number,
    default: 100,
    min: 1,
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'settled'],
    default: 'open',
    index: true,
  },
  winningOutcome: {
    type: Number,
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  closedAt: {
    type: Date,
    default: null,
  },
  settledAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

marketSchema.pre('save', function(next) {
  if (this.q.length !== this.outcomes.length) {
    this.q = new Array(this.outcomes.length).fill(0);
  }
  next();
});

module.exports = mongoose.model('Market', marketSchema);

