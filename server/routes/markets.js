const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Market = require('../models/Market');
const Trade = require('../models/Trade');
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
 * GET /api/markets/:id/orderbook
 * Get orderbook (all positions) for a market
 * MUST come before /:id route
 */
router.get('/:id/orderbook', optionalAuthenticate, async (req, res, next) => {
  try {
    const market = await Market.findById(req.params.id);
    if (!market) {
      throw new AppError('Market not found', 404);
    }

    // Get all trades for this market
    const trades = await Trade.find({ marketId: market._id })
      .populate('userId', 'email name')
      .sort({ timestamp: 1 });

    // Group by user and outcome
    const orderbook = {};
    trades.forEach(trade => {
      const userId = trade.userId._id.toString();
      const userName = trade.userId.name || trade.userId.email.split('@')[0];
      
      if (!orderbook[userId]) {
        orderbook[userId] = {
          userId,
          name: userName,
          positions: {},
        };
      }
      
      if (!orderbook[userId].positions[trade.outcomeIndex]) {
        orderbook[userId].positions[trade.outcomeIndex] = 0;
      }
      
      orderbook[userId].positions[trade.outcomeIndex] += trade.sharesDelta;
    });

    // Convert to array and filter out zero positions
    const orderbookArray = Object.values(orderbook)
      .map(user => {
        const positions = {};
        Object.entries(user.positions).forEach(([outcomeIndex, shares]) => {
          if (shares > 0) {
            positions[outcomeIndex] = shares;
          }
        });
        return {
          ...user,
          positions,
        };
      })
      .filter(user => Object.keys(user.positions).length > 0)
      .sort((a, b) => {
        // Sort by total shares (descending)
        const aTotal = Object.values(a.positions).reduce((sum, s) => sum + s, 0);
        const bTotal = Object.values(b.positions).reduce((sum, s) => sum + s, 0);
        return bTotal - aTotal;
      });

    res.json({ orderbook: orderbookArray });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/markets/:id/analytics
 * Get comprehensive analytics for a market
 * MUST come before /:id route
 */
router.get('/:id/analytics', optionalAuthenticate, async (req, res, next) => {
  try {
    const market = await Market.findById(req.params.id);
    if (!market) {
      throw new AppError('Market not found', 404);
    }

    const probabilities = calculateProbabilities(market.q, market.b);
    
    // Find leading outcome
    const leadingIndex = probabilities.reduce((maxIdx, prob, idx) => 
      prob > probabilities[maxIdx] ? idx : maxIdx, 0
    );

    // Get all trades
    const trades = await Trade.find({ marketId: market._id })
      .populate('userId', 'email name')
      .sort({ timestamp: -1 });

    // Calculate metrics
    const totalVolume = trades.reduce((sum, trade) => sum + Math.abs(trade.cost), 0);
    const uniqueTraders = new Set(trades.map(t => t.userId._id.toString())).size;
    const totalTrades = trades.length;
    
    // Most active trader (by trade count)
    const traderCounts = {};
    trades.forEach(trade => {
      const userId = trade.userId._id.toString();
      traderCounts[userId] = (traderCounts[userId] || 0) + 1;
    });
    const mostActiveTraderId = Object.keys(traderCounts).reduce((a, b) => 
      traderCounts[a] > traderCounts[b] ? a : b, Object.keys(traderCounts)[0]
    );
    const mostActiveTrader = trades.find(t => t.userId._id.toString() === mostActiveTraderId)?.userId;

    // Largest position holder (by total shares)
    const positionHolders = {};
    trades.forEach(trade => {
      const userId = trade.userId._id.toString();
      if (!positionHolders[userId]) {
        positionHolders[userId] = { user: trade.userId, positions: {} };
      }
      if (!positionHolders[userId].positions[trade.outcomeIndex]) {
        positionHolders[userId].positions[trade.outcomeIndex] = 0;
      }
      positionHolders[userId].positions[trade.outcomeIndex] += trade.sharesDelta;
    });
    
    let largestHolder = null;
    let maxShares = 0;
    Object.values(positionHolders).forEach(holder => {
      const totalShares = Object.values(holder.positions).reduce((sum, shares) => sum + Math.max(0, shares), 0);
      if (totalShares > maxShares) {
        maxShares = totalShares;
        largestHolder = holder.user;
      }
    });

    // Buy vs Sell ratio (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentTrades = trades.filter(t => new Date(t.timestamp) > oneDayAgo);
    const buys = recentTrades.filter(t => t.sharesDelta > 0).length;
    const sells = recentTrades.filter(t => t.sharesDelta < 0).length;
    const buySellRatio = recentTrades.length > 0 ? (buys / recentTrades.length * 100).toFixed(1) : 0;

    // Average trade size
    const avgTradeSize = trades.length > 0 
      ? (totalVolume / trades.length).toFixed(2) 
      : 0;

    // Outcome with most shares
    const outcomeShares = {};
    trades.forEach(trade => {
      if (!outcomeShares[trade.outcomeIndex]) {
        outcomeShares[trade.outcomeIndex] = 0;
      }
      outcomeShares[trade.outcomeIndex] += Math.max(0, trade.sharesDelta);
    });
    const mostSharesIndex = Object.keys(outcomeShares).reduce((a, b) => 
      outcomeShares[a] > outcomeShares[b] ? parseInt(a) : parseInt(b), 0
    );

    // Top position holders (sorted by total shares)
    const topHolders = Object.values(positionHolders)
      .map(holder => ({
        name: holder.user.name || holder.user.email.split('@')[0],
        totalShares: Object.values(holder.positions).reduce((sum, shares) => sum + Math.max(0, shares), 0),
      }))
      .filter(h => h.totalShares > 0)
      .sort((a, b) => b.totalShares - a.totalShares)
      .slice(0, 10); // Top 10

    // Top active traders (by trade count)
    const topTraders = Object.entries(traderCounts)
      .map(([userId, count]) => {
        const trader = trades.find(t => t.userId._id.toString() === userId)?.userId;
        return {
          name: trader ? (trader.name || trader.email.split('@')[0]) : 'Unknown',
          tradeCount: count,
        };
      })
      .sort((a, b) => b.tradeCount - a.tradeCount)
      .slice(0, 10); // Top 10

    // Outcome distribution (shares per outcome)
    const outcomeDistribution = market.outcomes.map((outcome, idx) => ({
      name: outcome,
      shares: outcomeShares[idx] || 0,
      probability: (probabilities[idx] * 100).toFixed(1),
    }));

    // Volume by outcome
    const volumeByOutcome = {};
    trades.forEach(trade => {
      if (!volumeByOutcome[trade.outcomeIndex]) {
        volumeByOutcome[trade.outcomeIndex] = 0;
      }
      volumeByOutcome[trade.outcomeIndex] += Math.abs(trade.cost);
    });

    const outcomeVolume = market.outcomes.map((outcome, idx) => ({
      name: outcome,
      volume: volumeByOutcome[idx] || 0,
    }));

    // Trade size distribution (for histogram)
    const tradeSizes = trades.map(t => Math.abs(t.cost));
    const sizeRanges = [
      { range: '0-10', min: 0, max: 10 },
      { range: '10-50', min: 10, max: 50 },
      { range: '50-100', min: 50, max: 100 },
      { range: '100-500', min: 100, max: 500 },
      { range: '500+', min: 500, max: Infinity },
    ];
    const sizeDistribution = sizeRanges.map(range => ({
      range: range.range,
      count: tradeSizes.filter(size => size >= range.min && size < range.max).length,
    }));

    // Probability vs Volume scatter data
    const probVolumeData = market.outcomes.map((outcome, idx) => ({
      name: outcome,
      probability: parseFloat((probabilities[idx] * 100).toFixed(1)),
      volume: volumeByOutcome[idx] || 0,
      shares: outcomeShares[idx] || 0,
    }));

    // Cumulative volume over time (last 20 trades for area chart)
    const recentTradesForChart = trades.slice(0, 20).reverse();
    let cumulativeVolume = 0;
    const cumulativeData = recentTradesForChart.map((trade, idx) => {
      cumulativeVolume += Math.abs(trade.cost);
      return {
        trade: idx + 1,
        volume: Math.abs(trade.cost),
        cumulative: cumulativeVolume,
        timestamp: new Date(trade.timestamp).toLocaleTimeString(),
      };
    });

    // Outcome comparison (radar chart data)
    const radarData = market.outcomes.map((outcome, idx) => ({
      outcome: outcome,
      probability: parseFloat((probabilities[idx] * 100).toFixed(1)),
      shares: parseFloat((outcomeShares[idx] || 0).toFixed(0)),
      volume: parseFloat((volumeByOutcome[idx] || 0).toFixed(0)),
      trades: trades.filter(t => t.outcomeIndex === idx).length,
    }));

    // Trader distribution (histogram of trades per trader)
    const tradesPerTrader = Object.values(traderCounts);
    const traderRangeCounts = [
      { range: '1 trade', min: 1, max: 1 },
      { range: '2-5 trades', min: 2, max: 5 },
      { range: '6-10 trades', min: 6, max: 10 },
      { range: '11-20 trades', min: 11, max: 20 },
      { range: '20+ trades', min: 21, max: Infinity },
    ];
    const traderDistribution = traderRangeCounts.map(range => ({
      range: range.range,
      count: tradesPerTrader.filter(count => count >= range.min && count <= range.max).length,
    }));

    // Outcome positions breakdown (stacked data)
    const outcomePositions = market.outcomes.map((outcome, idx) => {
      const buys = trades.filter(t => t.outcomeIndex === idx && t.sharesDelta > 0).length;
      const sells = trades.filter(t => t.outcomeIndex === idx && t.sharesDelta < 0).length;
      return {
        name: outcome,
        buys,
        sells,
        net: buys - sells,
      };
    });

    // Top holders by outcome (who holds most of each outcome)
    const topHoldersByOutcome = {};
    market.outcomes.forEach((outcome, idx) => {
      const holdersForOutcome = {};
      trades.forEach(trade => {
        if (trade.outcomeIndex === idx) {
          const userId = trade.userId._id.toString();
          if (!holdersForOutcome[userId]) {
            holdersForOutcome[userId] = {
              user: trade.userId,
              shares: 0,
            };
          }
          holdersForOutcome[userId].shares += Math.max(0, trade.sharesDelta);
        }
      });
      
      const sorted = Object.values(holdersForOutcome)
        .filter(h => h.shares > 0)
        .sort((a, b) => b.shares - a.shares)
        .slice(0, 5) // Top 5 per outcome
        .map(h => ({
          name: h.user.name || h.user.email.split('@')[0],
          shares: h.shares,
        }));
      
      if (sorted.length > 0) {
        topHoldersByOutcome[outcome] = sorted;
      }
    });

    // Top traders by volume (who traded most value)
    const traderVolume = {};
    trades.forEach(trade => {
      const userId = trade.userId._id.toString();
      if (!traderVolume[userId]) {
        traderVolume[userId] = {
          user: trade.userId,
          volume: 0,
          trades: 0,
        };
      }
      traderVolume[userId].volume += Math.abs(trade.cost);
      traderVolume[userId].trades += 1;
    });

    const topTradersByVolume = Object.values(traderVolume)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10)
      .map(t => ({
        name: t.user.name || t.user.email.split('@')[0],
        volume: t.volume,
        trades: t.trades,
      }));

    // Position concentration (cumulative % held by top holders)
    const allHolders = Object.values(positionHolders);
    const totalSharesAll = allHolders.reduce((sum, h) => {
      return sum + Object.values(h.positions).reduce((s, shares) => s + Math.max(0, shares), 0);
    }, 0);

    const concentrationData = [];
    if (totalSharesAll > 0) {
      const sortedHolders = allHolders
        .map(h => ({
          name: h.user.name || h.user.email.split('@')[0],
          shares: Object.values(h.positions).reduce((s, shares) => s + Math.max(0, shares), 0),
        }))
        .sort((a, b) => b.shares - a.shares);

      let cumulative = 0;
      sortedHolders.slice(0, 10).forEach((holder) => {
        cumulative += holder.shares;
        concentrationData.push({
          name: holder.name,
          percentage: (cumulative / totalSharesAll * 100).toFixed(1),
          shares: holder.shares,
        });
      });
    }

    // Recent activity by top holders
    const topHolderIds = topHolders.slice(0, 5).map(h => {
      const holder = allHolders.find(ah => 
        (ah.user.name || ah.user.email.split('@')[0]) === h.name
      );
      return holder ? holder.user._id.toString() : null;
    }).filter(Boolean);

    const recentActivityByHolders = trades
      .filter(t => topHolderIds.includes(t.userId._id.toString()))
      .slice(0, 15)
      .reverse()
      .map((trade, idx) => ({
        trade: idx + 1,
        holder: trade.userId.name || trade.userId.email.split('@')[0],
        volume: Math.abs(trade.cost),
        outcome: market.outcomes[trade.outcomeIndex],
      }));

    res.json({
      analytics: {
        leadingOutcome: {
          index: leadingIndex,
          name: market.outcomes[leadingIndex],
          probability: (probabilities[leadingIndex] * 100).toFixed(1),
        },
        totalVolume: totalVolume.toFixed(2),
        uniqueTraders,
        totalTrades,
        mostActiveTrader: mostActiveTrader ? {
          name: mostActiveTrader.name || mostActiveTrader.email.split('@')[0],
          email: mostActiveTrader.email,
          tradeCount: traderCounts[mostActiveTraderId],
        } : null,
        largestHolder: largestHolder ? {
          name: largestHolder.name || largestHolder.email.split('@')[0],
          email: largestHolder.email,
          totalShares: maxShares.toFixed(2),
        } : null,
        buySellRatio: parseFloat(buySellRatio),
        avgTradeSize: parseFloat(avgTradeSize),
        mostSharesOutcome: {
          index: mostSharesIndex,
          name: market.outcomes[mostSharesIndex],
          shares: outcomeShares[mostSharesIndex].toFixed(2),
        },
        recentActivity: recentTrades.length,
        // Chart data
        topHolders,
        topTraders,
        outcomeDistribution,
        outcomeVolume,
        buySellData: [
          { name: 'Buys', value: buys, fill: '#10b981' },
          { name: 'Sells', value: sells, fill: '#ef4444' },
        ],
        // Additional chart data
        sizeDistribution,
        probVolumeData,
        cumulativeData,
        radarData,
        traderDistribution,
        outcomePositions,
        // People-focused data
        topHoldersByOutcome,
        topTradersByVolume,
        concentrationData,
        recentActivityByHolders,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/markets/:id/history
 * Get trade history for a market with user details
 * MUST come before /:id route
 */
router.get('/:id/history', optionalAuthenticate, async (req, res, next) => {
  try {
    const market = await Market.findById(req.params.id);
    if (!market) {
      throw new AppError('Market not found', 404);
    }

    const { limit = 100 } = req.query;

    const trades = await Trade.find({ marketId: market._id })
      .populate('userId', 'email name')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    const history = trades.map(trade => ({
      _id: trade._id,
      user: {
        _id: trade.userId._id,
        email: trade.userId.email,
        name: trade.userId.name || trade.userId.email.split('@')[0],
      },
      outcomeIndex: trade.outcomeIndex,
      outcome: market.outcomes[trade.outcomeIndex],
      sharesDelta: trade.sharesDelta,
      cost: trade.cost,
      probabilitiesBefore: trade.probabilitiesBefore,
      probabilitiesAfter: trade.probabilitiesAfter,
      timestamp: trade.timestamp,
    }));

    res.json({ history });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/markets/:id
 * Get single market with probabilities and user position
 * MUST come after specific routes like /:id/history and /:id/orderbook
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
