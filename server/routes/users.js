const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Trade = require('../models/Trade');
const Market = require('../models/Market');

/**
 * GET /api/users/balance
 * Get user balance
 */
router.get('/balance', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ balance: user.balance });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/transactions
 * Get user transaction history
 */
router.get('/transactions', authenticate, async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .populate('marketId', 'title')
      .populate('tradeId')
      .sort({ timestamp: -1 })
      .limit(100);

    res.json({ transactions });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/portfolio
 * Get user's portfolio (positions across all markets)
 */
router.get('/portfolio', authenticate, async (req, res, next) => {
  try {
    const trades = await Trade.find({ userId: req.user._id })
      .populate('marketId', 'title outcomes status winningOutcome');

    const portfolio = {};
    trades.forEach(trade => {
      const marketId = trade.marketId._id.toString();
      if (!portfolio[marketId]) {
        portfolio[marketId] = {
          market: trade.marketId,
          positions: {},
        };
      }
      if (!portfolio[marketId].positions[trade.outcomeIndex]) {
        portfolio[marketId].positions[trade.outcomeIndex] = 0;
      }
      portfolio[marketId].positions[trade.outcomeIndex] += trade.sharesDelta;
    });

    // Convert to array and filter out zero positions
    const portfolioArray = Object.values(portfolio).map(item => {
      const positions = {};
      Object.entries(item.positions).forEach(([outcomeIndex, shares]) => {
        if (shares > 0) {
          positions[outcomeIndex] = shares;
        }
      });
      return {
        market: item.market,
        positions,
      };
    }).filter(item => Object.keys(item.positions).length > 0);

    res.json({ portfolio: portfolioArray });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

