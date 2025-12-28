// controllers/casinoController.js
const User = require('../../models/User');
const GameSession = require('../../models/GameSession');
const mongoose = require('mongoose');
const crypto = require('crypto');

// Get user's balance
exports.getBalance = async (req, res) => {
  try {
    const { firebaseUID } = req.query;
    
    if(!firebaseUID) throw new Error("Firebase UID required");

    const user = await User.findOne({ firebaseUID });
    if (!user) throw new Error("User not found");

    res.json({ 
      success: true, 
      balance: parseFloat(user.balance.toFixed(2)),
      user: {
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get user's game history
exports.getGameHistory = async (req, res) => {
  try {
    const { firebaseUID, limit = 50, offset = 0, gameType } = req.query;
    
    if(!firebaseUID) throw new Error("Firebase UID required");

    const user = await User.findOne({ firebaseUID });
    if (!user) throw new Error("User not found");

    // Build filter
    const filter = { user: user._id };
    if (gameType && gameType !== 'all') {
      filter.gameType = gameType.toUpperCase();
    }

    // Get games with pagination
    const games = await GameSession.find(filter)
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .select('-state.deck -state.mineLocations -serverSeed') // Hide sensitive data
      .lean();

    // Get total count for pagination
    const totalCount = await GameSession.countDocuments(filter);

    // Format games for response
    const formattedGames = games.map(game => ({
      id: game._id,
      gameType: game.gameType,
      betAmount: parseFloat(game.betAmount.toFixed(2)),
      multiplier: game.multiplier ? parseFloat(game.multiplier.toFixed(2)) : 0,
      payout: parseFloat(game.payout.toFixed(2)),
      profit: parseFloat((game.payout - game.betAmount).toFixed(2)),
      isActive: game.isActive,
      createdAt: game.createdAt,
      clientSeed: game.clientSeed,
      nonce: game.nonce
    }));

    res.json({ 
      success: true, 
      games: formattedGames,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get user statistics
exports.getUserStats = async (req, res) => {
  try {
    const { firebaseUID } = req.query;
    
    if(!firebaseUID) throw new Error("Firebase UID required");

    const user = await User.findOne({ firebaseUID });
    if (!user) throw new Error("User not found");

    // Aggregate statistics by game type
    const gameStats = await GameSession.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: '$gameType',
          totalBets: { $sum: 1 },
          totalWagered: { $sum: '$betAmount' },
          totalPayout: { $sum: '$payout' },
          wins: {
            $sum: {
              $cond: [{ $gt: ['$payout', '$betAmount'] }, 1, 0]
            }
          },
          losses: {
            $sum: {
              $cond: [{ $lt: ['$payout', '$betAmount'] }, 1, 0]
            }
          },
          biggestWin: { $max: { $subtract: ['$payout', '$betAmount'] } },
          biggestLoss: { $min: { $subtract: ['$payout', '$betAmount'] } }
        }
      }
    ]);

    // Overall statistics
    const overallStats = await GameSession.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: null,
          totalBets: { $sum: 1 },
          totalWagered: { $sum: '$betAmount' },
          totalPayout: { $sum: '$payout' },
          wins: {
            $sum: {
              $cond: [{ $gt: ['$payout', '$betAmount'] }, 1, 0]
            }
          },
          losses: {
            $sum: {
              $cond: [{ $lt: ['$payout', '$betAmount'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const overall = overallStats[0] || {
      totalBets: 0,
      totalWagered: 0,
      totalPayout: 0,
      wins: 0,
      losses: 0
    };

    const profit = overall.totalPayout - overall.totalWagered;
    const winRate = overall.totalBets > 0 ? (overall.wins / overall.totalBets * 100) : 0;

    // Format game stats
    const formattedGameStats = gameStats.map(stat => ({
      gameType: stat._id,
      totalBets: stat.totalBets,
      totalWagered: parseFloat(stat.totalWagered.toFixed(2)),
      totalPayout: parseFloat(stat.totalPayout.toFixed(2)),
      profit: parseFloat((stat.totalPayout - stat.totalWagered).toFixed(2)),
      wins: stat.wins,
      losses: stat.losses,
      winRate: parseFloat((stat.wins / stat.totalBets * 100).toFixed(2)),
      biggestWin: parseFloat(stat.biggestWin.toFixed(2)),
      biggestLoss: parseFloat(Math.abs(stat.biggestLoss).toFixed(2))
    }));

    res.json({ 
      success: true, 
      balance: parseFloat(user.balance.toFixed(2)),
      overall: {
        totalBets: overall.totalBets,
        totalWagered: parseFloat(overall.totalWagered.toFixed(2)),
        totalPayout: parseFloat(overall.totalPayout.toFixed(2)),
        profit: parseFloat(profit.toFixed(2)),
        wins: overall.wins,
        losses: overall.losses,
        winRate: parseFloat(winRate.toFixed(2))
      },
      byGame: formattedGameStats
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Verify provably fair game
exports.verifyGame = async (req, res) => {
  try {
    const { gameId } = req.query;
    
    if(!gameId) throw new Error("Game ID required");

    const game = await GameSession.findById(gameId);
    if (!game) throw new Error("Game not found");

    // Return all seeds and game data for verification
    const verificationData = {
      success: true,
      gameId: game._id,
      gameType: game.gameType,
      serverSeed: game.serverSeed,
      clientSeed: game.clientSeed,
      nonce: game.nonce,
      betAmount: parseFloat(game.betAmount.toFixed(2)),
      payout: parseFloat(game.payout.toFixed(2)),
      createdAt: game.createdAt
    };

    // Add game-specific result data
    switch(game.gameType) {
      case 'MINES':
        verificationData.result = {
          minesCount: game.state.minesCount,
          mineLocations: game.state.mineLocations,
          revealedTiles: game.state.revealedTiles
        };
        break;
      case 'COINFLIP':
        verificationData.result = {
          choice: game.state.choice,
          result: game.state.result
        };
        break;
      case 'DICE':
        verificationData.result = {
          targetNumber: game.state.targetNumber,
          condition: game.state.condition,
          roll: game.state.roll
        };
        break;
      case 'PLINKO':
        verificationData.result = {
          rows: game.state.rows,
          risk: game.state.risk,
          path: game.state.path,
          bucketIndex: game.state.bucketIndex
        };
        break;
      case 'ROULETTE':
        verificationData.result = {
          resultNumber: game.state.resultNumber,
          resultColor: game.state.resultColor
        };
        break;
      case 'BLACKJACK':
        verificationData.result = {
          outcome: game.state.outcome,
          playerHand: game.state.playerHand,
          dealerHand: game.state.dealerHand
        };
        break;
    }

    // Generate verification hash for client to verify
    const hash = crypto.createHmac('sha256', game.serverSeed)
      .update(`${game.clientSeed}:${game.nonce}`)
      .digest('hex');
    
    verificationData.verificationHash = hash;
    verificationData.serverSeedHash = crypto.createHash('sha256')
      .update(game.serverSeed)
      .digest('hex');

    res.json(verificationData);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get active games for user
exports.getActiveGames = async (req, res) => {
  try {
    const { firebaseUID } = req.query;
    
    if(!firebaseUID) throw new Error("Firebase UID required");

    const user = await User.findOne({ firebaseUID });
    if (!user) throw new Error("User not found");

    const activeGames = await GameSession.find({ 
      user: user._id, 
      isActive: true 
    })
    .sort({ createdAt: -1 })
    .select('-state.deck -state.mineLocations -serverSeed')
    .lean();

    const formattedGames = activeGames.map(game => ({
      id: game._id,
      gameType: game.gameType,
      betAmount: parseFloat(game.betAmount.toFixed(2)),
      multiplier: game.multiplier ? parseFloat(game.multiplier.toFixed(2)) : 1,
      currentPayout: game.multiplier ? parseFloat((game.betAmount * game.multiplier).toFixed(2)) : 0,
      createdAt: game.createdAt
    }));

    res.json({ 
      success: true, 
      activeGames: formattedGames
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get recent big wins (leaderboard)
exports.getRecentWins = async (req, res) => {
  try {
    const { limit = 20, minProfit = 10 } = req.query;

    const recentWins = await GameSession.aggregate([
      {
        $match: {
          isActive: false,
          $expr: { $gt: [{ $subtract: ['$payout', '$betAmount'] }, parseFloat(minProfit)] }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $project: {
          gameType: 1,
          betAmount: 1,
          payout: 1,
          multiplier: 1,
          profit: { $subtract: ['$payout', '$betAmount'] },
          username: '$userInfo.username',
          createdAt: 1
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    const formattedWins = recentWins.map(win => ({
      gameType: win.gameType,
      username: win.username.substring(0, 3) + '***', // Anonymize
      betAmount: parseFloat(win.betAmount.toFixed(2)),
      multiplier: parseFloat(win.multiplier.toFixed(2)),
      profit: parseFloat(win.profit.toFixed(2)),
      createdAt: win.createdAt
    }));

    res.json({ 
      success: true, 
      recentWins: formattedWins
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get casino statistics
exports.getCasinoStats = async (req, res) => {
  try {
    const stats = await GameSession.aggregate([
      {
        $match: { isActive: false }
      },
      {
        $group: {
          _id: null,
          totalGames: { $sum: 1 },
          totalWagered: { $sum: '$betAmount' },
          totalPayout: { $sum: '$payout' },
          averageBet: { $avg: '$betAmount' },
          averagePayout: { $avg: '$payout' }
        }
      }
    ]);

    const gameTypeStats = await GameSession.aggregate([
      {
        $match: { isActive: false }
      },
      {
        $group: {
          _id: '$gameType',
          count: { $sum: 1 },
          totalWagered: { $sum: '$betAmount' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const overall = stats[0] || {
      totalGames: 0,
      totalWagered: 0,
      totalPayout: 0,
      averageBet: 0,
      averagePayout: 0
    };

    res.json({
      success: true,
      overall: {
        totalGames: overall.totalGames,
        totalWagered: parseFloat(overall.totalWagered.toFixed(2)),
        totalPayout: parseFloat(overall.totalPayout.toFixed(2)),
        houseEdge: overall.totalWagered > 0 ? parseFloat(((1 - overall.totalPayout / overall.totalWagered) * 100).toFixed(2)) : 0,
        averageBet: parseFloat(overall.averageBet.toFixed(2)),
        averagePayout: parseFloat(overall.averagePayout.toFixed(2))
      },
      byGameType: gameTypeStats.map(stat => ({
        gameType: stat._id,
        gamesPlayed: stat.count,
        totalWagered: parseFloat(stat.totalWagered.toFixed(2)),
        percentage: overall.totalGames > 0 ? parseFloat((stat.count / overall.totalGames * 100).toFixed(2)) : 0
      }))
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getBalance: exports.getBalance,
  getGameHistory: exports.getGameHistory,
  getUserStats: exports.getUserStats,
  verifyGame: exports.verifyGame,
  getActiveGames: exports.getActiveGames,
  getRecentWins: exports.getRecentWins,
  getCasinoStats: exports.getCasinoStats
};