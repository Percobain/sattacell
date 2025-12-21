const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
    index: true,
  },
  count: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true,
});

// Compound index to ensure a user only has one vote document per team
voteSchema.index({ user: 1, team: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);
