// routes/casinoRoutes.js
const express = require('express');
const router = express.Router();

// Import main casino controller
const casinoController = require('../controllers/games/casinoController');

// Import game controllers
const minesController = require('../controllers/games/minesController');
const coinFlipController = require('../controllers/games/coinFlipController');
const diceController = require('../controllers/games/diceController');
const plinkoController = require('../controllers/games/plinkoController');
const rouletteController = require('../controllers/games/rouletteController');
const blackjackController = require('../controllers/games/blackjackController');

// ==========================================
// CASINO GENERAL ROUTES
// ==========================================

// Get user balance
// GET /api/casino/balance?firebaseUID=xxx
router.get('/balance', casinoController.getBalance);

// Get game history
// GET /api/casino/history?firebaseUID=xxx&limit=50&offset=0&gameType=MINES
router.get('/history', casinoController.getGameHistory);

// Get user statistics
// GET /api/casino/stats?firebaseUID=xxx
router.get('/stats', casinoController.getUserStats);

// Verify provably fair game
// GET /api/casino/verify?gameId=xxx
router.get('/verify', casinoController.verifyGame);

// Get active games for user
// GET /api/casino/active?firebaseUID=xxx
router.get('/active', casinoController.getActiveGames);

// Get recent big wins (public leaderboard)
// GET /api/casino/recent-wins?limit=20&minProfit=10
router.get('/recent-wins', casinoController.getRecentWins);

// Get casino-wide statistics
// GET /api/casino/casino-stats
router.get('/casino-stats', casinoController.getCasinoStats);

// ==========================================
// MINES GAME ROUTES
// ==========================================

// Start new mines game
// POST /api/casino/mines/start
// Body: { firebaseUID, betAmount, minesCount }
router.post('/mines/start', minesController.minesStart);

// Click a tile in mines game
// POST /api/casino/mines/click
// Body: { gameId, tileIndex }
router.post('/mines/click', minesController.minesClick);

// Cashout from mines game
// POST /api/casino/mines/cashout
// Body: { gameId }
router.post('/mines/cashout', minesController.minesCashout);

// ==========================================
// COIN FLIP GAME ROUTES
// ==========================================

// Play coin flip
// POST /api/casino/coinflip/flip
// Body: { firebaseUID, betAmount, choice: 'heads' | 'tails' }
router.post('/coinflip/flip', coinFlipController.coinFlip);

// ==========================================
// DICE GAME ROUTES
// ==========================================

// Roll dice
// POST /api/casino/dice/roll
// Body: { firebaseUID, betAmount, targetNumber, condition: 'over' | 'under' }
router.post('/dice/roll', diceController.diceRoll);

// ==========================================
// PLINKO GAME ROUTES
// ==========================================

// Drop plinko ball (Bet)
// POST /api/casino/plinko/bet
// Body: { firebaseUID, betAmount, rows: 8|12|16, risk: 'low'|'medium'|'high' }
router.post('/plinko/bet', plinkoController.plinkoBet);

// Plinko Result (Payout)
// POST /api/casino/plinko/result
// Body: { gameId, bucketIndex }
router.post('/plinko/result', plinkoController.plinkoResult);

// ==========================================
// ROULETTE GAME ROUTES
// ==========================================

// Spin roulette
// POST /api/casino/roulette
// Body: { firebaseUID, bets: [{ type: 'number'|'color'|'parity', value: any, amount: number }] }
router.post('/roulette', rouletteController.rouletteSpin);

// ==========================================
// BLACKJACK GAME ROUTES
// ==========================================

// Start new blackjack game
// POST /api/casino/blackjack/init
// Body: { firebaseUID, betAmount }
router.post('/blackjack/init', blackjackController.blackjackInit);

// Hit - draw another card
// POST /api/casino/blackjack/hit
// Body: { gameId }
router.post('/blackjack/hit', blackjackController.blackjackHit);

// Stand - dealer plays
// POST /api/casino/blackjack/stand
// Body: { gameId }
router.post('/blackjack/stand', blackjackController.blackjackStand);

// Double down
// POST /api/casino/blackjack/double
// Body: { gameId }
router.post('/blackjack/double', blackjackController.blackjackDouble);

// Split (optional - if implemented)
// POST /api/casino/blackjack/split
// Body: { gameId }
router.post('/blackjack/split', blackjackController.blackjackSplit);

// ==========================================
// ERROR HANDLING MIDDLEWARE
// ==========================================

// 404 handler for undefined routes
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Casino route not found'
  });
});

// Error handler
router.use((err, req, res, next) => {
  console.error('Casino route error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

module.exports = router;

// ==========================================
// USAGE IN MAIN APP
// ==========================================
/*

In your main app.js or server.js file:

const express = require('express');
const app = express();
const casinoRoutes = require('./routes/casinoRoutes');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount casino routes
app.use('/api/casino', casinoRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Casino API running on port ${PORT}`);
});

*/

// ==========================================
// API ENDPOINTS SUMMARY
// ==========================================
/*

GENERAL ROUTES:
├── GET  /api/casino/balance?firebaseUID=xxx
├── GET  /api/casino/history?firebaseUID=xxx&limit=50&offset=0&gameType=MINES
├── GET  /api/casino/stats?firebaseUID=xxx
├── GET  /api/casino/verify?gameId=xxx
├── GET  /api/casino/active?firebaseUID=xxx
├── GET  /api/casino/recent-wins?limit=20&minProfit=10
└── GET  /api/casino/casino-stats

GAME ROUTES:
├── MINES
│   ├── POST /api/casino/mines/start
│   ├── POST /api/casino/mines/click
│   └── POST /api/casino/mines/cashout
│
├── COIN FLIP
│   └── POST /api/casino/coinflip
│
├── DICE
│   └── POST /api/casino/dice/roll
│
├── PLINKO
│   └── POST /api/casino/plinko
│
├── ROULETTE
│   └── POST /api/casino/roulette
│
└── BLACKJACK
    ├── POST /api/casino/blackjack/init
    ├── POST /api/casino/blackjack/hit
    ├── POST /api/casino/blackjack/stand
    ├── POST /api/casino/blackjack/double
    └── POST /api/casino/blackjack/split

*/