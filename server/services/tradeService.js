const mongoose = require('mongoose');
const Market = require('../models/Market');
const User = require('../models/User');
const Trade = require('../models/Trade');
const Transaction = require('../models/Transaction');
const { calculateProbabilities, calculateTradeCost } = require('./lmsrService');
const { AppError } = require('../utils/errors');

/**
 * Execute a trade atomically
 * @param {string} marketId - Market ID
 * @param {string} userId - User ID
 * @param {number} outcomeIndex - Index of outcome to trade
 * @param {number} sharesDelta - Positive = buy, Negative = sell
 * @returns {Promise<Object>} Trade result with updated probabilities
 */
async function executeTrade(marketId, userId, outcomeIndex, sharesDelta) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Step 1: Fetch current market state
    const market = await Market.findById(marketId).session(session);
    if (!market) {
      throw new AppError('Market not found', 404);
    }

    if (market.status !== 'open') {
      throw new AppError('Market is not open for trading', 400);
    }

    if (outcomeIndex < 0 || outcomeIndex >= market.outcomes.length) {
      throw new AppError('Invalid outcome index', 400);
    }

    // Step 2: Calculate LMSR cost BEFORE trade
    const qBefore = [...market.q];
    const probabilitiesBefore = calculateProbabilities(qBefore, market.b);

    // Step 3: Apply delta to selected outcome
    const qAfter = [...qBefore];
    qAfter[outcomeIndex] += sharesDelta;

    // Validate: can't have negative shares
    if (qAfter[outcomeIndex] < 0) {
      throw new AppError('Cannot sell more shares than owned', 400);
    }

    // Step 4: Calculate LMSR cost AFTER trade
    const probabilitiesAfter = calculateProbabilities(qAfter, market.b);
    const cost = calculateTradeCost(qBefore, qAfter, market.b);

    // Step 5: Fetch user and validate balance
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // If buying (cost > 0), check balance
    if (cost > 0 && user.balance < cost) {
      throw new AppError('Insufficient balance', 400);
    }

    // Step 6: Update outcome shares (market state)
    market.q = qAfter;
    await market.save({ session });

    // Step 7: Deduct/add tokens from user
    user.balance -= cost; // cost is positive for buys, negative for sells
    if (user.balance < 0) {
      throw new AppError('Balance would be negative', 400);
    }
    await user.save({ session });

    // Step 8: Record trade
    const trade = await Trade.create([{
      marketId: market._id,
      userId: user._id,
      outcomeIndex,
      sharesDelta,
      cost,
      qBefore,
      qAfter,
      probabilitiesBefore,
      probabilitiesAfter,
    }], { session });

    // Record transaction
    await Transaction.create([{
      userId: user._id,
      type: 'trade',
      amount: -cost, // Negative because we're deducting from balance
      marketId: market._id,
      tradeId: trade[0]._id,
    }], { session });

    await session.commitTransaction();

    return {
      trade: trade[0],
      probabilities: probabilitiesAfter,
      userBalance: user.balance,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Get user's position in a market
 */
async function getUserPosition(marketId, userId) {
  const trades = await Trade.find({
    marketId,
    userId,
  }).sort({ timestamp: 1 });

  const positions = {};
  trades.forEach(trade => {
    if (!positions[trade.outcomeIndex]) {
      positions[trade.outcomeIndex] = 0;
    }
    positions[trade.outcomeIndex] += trade.sharesDelta;
  });

  return positions;
}

module.exports = {
  executeTrade,
  getUserPosition,
};

