const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'GLOBAL_CONFIG'
  },
  isVotingActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
