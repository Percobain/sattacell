const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getAuthUrl, getTokens } = require('../utils/googleAuth');
const User = require('../models/User');

/**
 * GET /api/auth/google
 * Get Google OAuth URL
 */
router.get('/google', (req, res) => {
  try {
    const authUrl = getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/callback
 * Handle OAuth callback and exchange code for tokens
 */
router.post('/callback', async (req, res, next) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    const { tokens, user: googleUser } = await getTokens(code);

    // Get or create user
    let user = await User.findOne({ firebaseUID: googleUser.uid });
    
    if (!user) {
      user = await User.create({
        firebaseUID: googleUser.uid,
        email: googleUser.email,
        name: googleUser.name || googleUser.email.split('@')[0],
        balance: 1000,
        isAdmin: false,
      });
    } else {
      // Update email and name if changed
      if (user.email !== googleUser.email) {
        user.email = googleUser.email;
      }
      if (googleUser.name && user.name !== googleUser.name) {
        user.name = googleUser.name;
      }
      await user.save();
    }

    res.json({
      success: true,
      token: tokens.id_token,
      refreshToken: tokens.refresh_token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        balance: user.balance,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        balance: user.balance,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
