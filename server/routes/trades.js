const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { executeTrade, getUserPosition } = require('../services/tradeService');
const Trade = require('../models/Trade');
const { AppError } = require('../utils/errors');

/**
 * POST /api/trades
 * Execute a trade
 */
router.post(
  '/',
  authenticate,
  [
    body('marketId').isMongoId().withMessage('Valid marketId is required'),
    body('outcomeIndex').isInt({ min: 0 }).withMessage('Valid outcomeIndex is required'),
    body('sharesDelta')
      .isFloat({ min: 0.01 })
      .withMessage('sharesDelta must be a positive number'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { marketId, outcomeIndex, sharesDelta } = req.body;

      const result = await executeTrade(
        marketId,
        req.user._id,
        outcomeIndex,
        parseFloat(sharesDelta)
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/trades/sell
 * Sell shares (negative sharesDelta)
 */
router.post(
  '/sell',
  authenticate,
  [
    body('marketId').isMongoId().withMessage('Valid marketId is required'),
    body('outcomeIndex').isInt({ min: 0 }).withMessage('Valid outcomeIndex is required'),
    body('shares')
      .isFloat({ min: 0.01 })
      .withMessage('shares must be a positive number'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { marketId, outcomeIndex, shares } = req.body;

      // Check user has enough shares
      const position = await getUserPosition(marketId, req.user._id);
      const currentShares = position[outcomeIndex] || 0;

      if (currentShares < shares) {
        throw new AppError('Insufficient shares to sell', 400);
      }

      const result = await executeTrade(
        marketId,
        req.user._id,
        outcomeIndex,
        -parseFloat(shares)
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/trades
 * Get user's trade history
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { marketId } = req.query;
    const query = { userId: req.user._id };
    if (marketId) {
      query.marketId = marketId;
    }

    const trades = await Trade.find(query)
      .populate('marketId', 'title outcomes')
      .sort({ timestamp: -1 })
      .limit(100);

    res.json({ trades });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

