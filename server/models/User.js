const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUID: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
    lowercase: true,
  },
  balance: {
    type: Number,
    default: 1000,
    min: 0,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);

