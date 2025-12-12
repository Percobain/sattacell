const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Market = require('../models/Market');
const { calculateProbabilities } = require('../services/lmsrService');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { getUserPosition } = require('../services/tradeService');
const { AppError } = require('../utils/errors');

/**
 * GET /api/markets
 * Get all markets with optional filtering
 */
router.get('/', optionalAuthenticate, async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) {
      query.status = status;
    }

    const markets = await Market.find(query)
      .populate('createdBy', 'email')
      .sort({ createdAt: -1 });

    const marketsWithProbabilities = markets.map(market => {
      const probabilities = calculateProbabilities(market.q, market.b);
      return {
        ...market.toObject(),
        probabilities,
      };
    });

    res.json({ markets: marketsWithProbabilities });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/markets/:id
 * Get single market with probabilities and user position
 */
router.get('/:id', optionalAuthenticate, async (req, res, next) => {
  try {
    const market = await Market.findById(req.params.id)
      .populate('createdBy', 'email');

    if (!market) {
      throw new AppError('Market not found', 404);
    }

    const probabilities = calculateProbabilities(market.q, market.b);
    const result = {
      ...market.toObject(),
      probabilities,
    };

    // If user is authenticated, include their position
    if (req.user) {
      const position = await getUserPosition(market._id, req.user._id);
      result.userPosition = position;
    }

    res.json({ market: result });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/markets
 * Create a new market (admin only)
 */
router.post(
  '/',
  authenticate,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('outcomes')
      .isArray({ min: 2 })
      .withMessage('At least 2 outcomes are required'),
    body('outcomes.*').trim().notEmpty().withMessage('All outcomes must be non-empty'),
    body('b').optional().isFloat({ min: 1 }).withMessage('b must be a positive number'),
  ],
  async (req, res, next) => {
    try {
      if (!req.user.isAdmin) {
        throw new AppError('Only admins can create markets', 403);
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, outcomes, b = 100 } = req.body;

      // Ensure unique outcomes
      const uniqueOutcomes = [...new Set(outcomes)];
      if (uniqueOutcomes.length !== outcomes.length) {
        return res.status(400).json({ error: 'Outcomes must be unique' });
      }

      const market = await Market.create({
        title,
        description,
        outcomes: uniqueOutcomes,
        b,
        createdBy: req.user._id,
        q: new Array(uniqueOutcomes.length).fill(0),
      });

      const probabilities = calculateProbabilities(market.q, market.b);

      res.status(201).json({
        market: {
          ...market.toObject(),
          probabilities,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;

