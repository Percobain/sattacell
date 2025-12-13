const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getAuthUrl, getTokens } = require('../utils/googleAuth');
const User = require('../models/User');

const APPROVED_EMAILS = [
  "viraj.bhartiya@somaiya.edu",
  "rathod.a@somaiya.edu",
  "omik.acharya@somaiya.edu",
  "a.belgaonkar@somaiya.edu",
  "kumar.tanay@somaiya.edu",
  "vivek.kj@somaiya.edu",
  "tanuj.a@somaiya.edu",
  "shantanav.m@somaiya.edu",
  "vinayak.pai@somaiya.edu",
  "anmol.rai@somaiya.edu",
  "samagra.a@somaiya.edu",
  "ashwera.h@somaiya.edu",
  "aditi.singh4@somaiya.edu",
  "amrit.nigam@somaiya.edu",
  "akanksha.agroya@somaiya.edu",
  "ameya.deore@somaiya.edu",
  "purva.pote@somaiya.edu",
  "divyanshi.y@somaiya.edu",
  "dhanya.shukla@somaiya.edu",
  "rishi.shanbhag@somaiya.edu",
  "dharmik.c@somaiya.edu",
  "shreyans.t@somaiya.edu",
  "c.dhamdhere@somaiya.edu",
  "samaira.s@somaiya.edu",
  "h.ravariya@somaiya.edu",
  "parth.panwar@somaiya.edu",
  "arshia.dang@somaiya.edu",
  "shravika.m@somaiya.edu",
  "s.talandage@somaiya.edu",
  "shaurya30@somaiya.edu",
  "bhoumik.s@somaiya.edu",
  "dhruv.kumar@somaiya.edu",
  "pranav.mendon@somaiya.edu",
  "anchita.sahu@somaiya.edu",
  "mitali.paul@somaiya.edu",
  "rudrakshi.a@somaiya.edu",
  "yash.agroya@somaiya.edu"
];
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
      const isApproved = APPROVED_EMAILS.includes(googleUser.email);
      user = await User.create({
        firebaseUID: googleUser.uid,
        email: googleUser.email,
        name: googleUser.name || googleUser.email.split('@')[0],
        balance: 1000,
        isAdmin: false,
        isApproved
      });

      if (!isApproved) {
        return res.status(403).json({ error: 'Account pending approval by admin' });
      }
    } else {
      if (!user.isApproved) {
        return res.status(403).json({ error: 'Account pending approval by admin' });
      }
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
