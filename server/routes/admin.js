const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { requireAdmin, verifyAdminPassword } = require('../middleware/admin');
const Market = require('../models/Market');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const SystemConfig = require('../models/SystemConfig');
const { settleMarket } = require('../services/settlementService');
const { AppError } = require('../utils/errors');

/**
 * POST /api/admin/login
 * Verify admin password and create session
 */
router.post('/login', verifyAdminPassword, authenticate, async (req, res, next) => {
  try {
    if (!req.user.isAdmin) {
      throw new AppError('User is not an admin', 403);
    }
    res.json({ success: true, message: 'Admin access granted' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/users/search
 * Search for a user by email
 */
router.get('/users/search', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: { _id: user._id, email: user.email, balance: user.balance } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/grant-tokens
 * Grant tokens to a user (accepts userId or email)
 */
router.post(
  '/grant-tokens',
  authenticate,
  requireAdmin,
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId, email, amount } = req.body;
      
      let targetUser;
      if (userId) {
        targetUser = await User.findById(userId);
      } else if (email) {
        targetUser = await User.findOne({ email: email.toLowerCase() });
      } else {
        return res.status(400).json({ error: 'Either userId or email is required' });
      }
      if (!targetUser) {
        throw new AppError('User not found', 404);
      }

      const session = await require('mongoose').startSession();
      session.startTransaction();

      try {
        targetUser.balance += parseFloat(amount);
        await targetUser.save({ session });

        await Transaction.create([{
          userId: targetUser._id,
          type: 'admin_grant',
          amount: parseFloat(amount),
          adminId: req.user._id,
        }], { session });

        await session.commitTransaction();

        res.json({
          success: true,
          user: {
            _id: targetUser._id,
            email: targetUser.email,
            balance: targetUser.balance,
          },
        });
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/admin/settle-market
 * Settle a market
 */
router.post(
  '/settle-market',
  authenticate,
  requireAdmin,
  [
    body('marketId').isMongoId().withMessage('Valid marketId is required'),
    body('winningOutcomeIndex')
      .isInt({ min: 0 })
      .withMessage('Valid winningOutcomeIndex is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { marketId, winningOutcomeIndex } = req.body;

      const result = await settleMarket(marketId, winningOutcomeIndex);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/admin/stats
 * Get admin statistics
 */
router.get('/stats', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const totalMarkets = await Market.countDocuments();
    const openMarkets = await Market.countDocuments({ status: 'open' });
    const settledMarkets = await Market.countDocuments({ status: 'settled' });
    const totalUsers = await User.countDocuments();
    const totalTransactions = await Transaction.countDocuments();

    res.json({
      stats: {
        totalMarkets,
        openMarkets,
        settledMarkets,
        totalUsers,
        totalTransactions,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/users/pending
 * Get list of pending users awaiting approval
 */
router.get('/users/pending', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const pendingUsers = await User.find({ isApproved: false })
      .select('email name firebaseUID createdAt')
      .sort({ createdAt: -1 });
    res.json({ users: pendingUsers });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/users/:userId/approve
 * Approve a pending user
 */
router.post('/users/:userId/approve', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isApproved) {
      return res.status(400).json({ error: 'User is already approved' });
    }

    user.isApproved = true;
    await user.save();

    res.json({ success: true, message: 'User approved successfully', user });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/users/:userId/reject
 * Reject (delete) a pending user
 */
router.delete('/users/:userId/reject', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await User.findByIdAndDelete(userId);

    res.json({ success: true, message: 'User request rejected and removed' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/config
 * Get system configuration
 */
router.get('/config', authenticate, requireAdmin, async (req, res, next) => {
  try {
    let config = await SystemConfig.findOne({ key: 'GLOBAL_CONFIG' });
    if (!config) {
      config = await SystemConfig.create({ key: 'GLOBAL_CONFIG' });
    }
    res.json({ config });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/config
 * Update system configuration
 */
router.post('/config', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { isVotingActive } = req.body;
    
    let config = await SystemConfig.findOne({ key: 'GLOBAL_CONFIG' });
    if (!config) {
      config = await SystemConfig.create({ key: 'GLOBAL_CONFIG', isVotingActive });
    } else {
      if (typeof isVotingActive !== 'undefined') {
        config.isVotingActive = isVotingActive;
      }
      await config.save();
    }
    
    res.json({ success: true, config });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

