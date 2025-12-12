const mongoose = require('mongoose');
const Market = require('../models/Market');
const Trade = require('../models/Trade');
const Transaction = require('../models/Transaction');
const { calculateProbabilities } = require('./lmsrService');
const { AppError } = require('../utils/errors');

/**
 * Settle a market and distribute payouts
 * @param {string} marketId - Market ID
 * @param {number} winningOutcomeIndex - Index of winning outcome
 * @returns {Promise<Object>} Settlement result
 */
async function settleMarket(marketId, winningOutcomeIndex) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Fetch market
    const market = await Market.findById(marketId).session(session);
    if (!market) {
      throw new AppError('Market not found', 404);
    }

    if (market.status === 'settled') {
      throw new AppError('Market already settled', 400);
    }

    if (winningOutcomeIndex < 0 || winningOutcomeIndex >= market.outcomes.length) {
      throw new AppError('Invalid winning outcome index', 400);
    }

    // Get all trades for this market
    const trades = await Trade.find({ marketId }).session(session);
    
    // Calculate final probabilities
    const finalProbabilities = calculateProbabilities(market.q, market.b);
    
    // Group trades by user and outcome
    const userPositions = {};
    trades.forEach(trade => {
      const userId = trade.userId.toString();
      if (!userPositions[userId]) {
        userPositions[userId] = {};
      }
      if (!userPositions[userId][trade.outcomeIndex]) {
        userPositions[userId][trade.outcomeIndex] = 0;
      }
      userPositions[userId][trade.outcomeIndex] += trade.sharesDelta;
    });

    // Calculate payouts
    const payouts = [];
    const User = require('../models/User');
    
    for (const [userId, positions] of Object.entries(userPositions)) {
      const sharesInWinningOutcome = positions[winningOutcomeIndex] || 0;
      
      if (sharesInWinningOutcome > 0) {
        // Each share in winning outcome pays 1 token
        const payout = sharesInWinningOutcome;
        
        const user = await User.findById(userId).session(session);
        if (user) {
          user.balance += payout;
          await user.save({ session });
          
          await Transaction.create([{
            userId: user._id,
            type: 'settlement',
            amount: payout,
            marketId: market._id,
          }], { session });
          
          payouts.push({
            userId: user._id,
            shares: sharesInWinningOutcome,
            payout,
          });
        }
      }
    }

    // Update market status
    market.status = 'settled';
    market.winningOutcome = winningOutcomeIndex;
    market.settledAt = new Date();
    await market.save({ session });

    await session.commitTransaction();

    return {
      market,
      payouts,
      finalProbabilities,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

module.exports = {
  settleMarket,
};

