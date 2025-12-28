// server/controllers/casinoController.js (or wherever plinkoDrop lives)
const User = require('../../models/User');
const GameSession = require('../../models/GameSession');
const mongoose = require('mongoose');
const { 
  generateServerSeed, 
  generateClientSeed, 
  generateGameResult, 
  hashToNumber,
  hashServerSeed 
} = require('../../utils/provablyFair');

const PLINKO_MULTIPLIERS = {
  8: {
    low: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29]
  },
  12: {
    low: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
    medium: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    high: [76, 18, 5, 1.7, 0.7, 0.2, 0.2, 0.2, 0.7, 1.7, 5, 18, 76]
  },
  16: {
    low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
    medium: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
    high: [420, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 420]
  }
};

exports.plinkoBet = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { firebaseUID } = req.body;
    const betAmount = Number(req.body.betAmount);
    const rows = Number(req.body.rows);
    const risk = req.body.risk;

    // Validation
    if (!Number.isFinite(betAmount) || betAmount <= 0) throw new Error("Invalid bet amount");
    if (![8, 12, 16].includes(rows)) throw new Error("Invalid rows configuration");
    if (!['low', 'medium', 'high'].includes(risk)) throw new Error("Invalid risk level");

    const user = await User.findOne({ firebaseUID }).session(session);
    if (!user) throw new Error("User not found");
    if (user.balance < betAmount) throw new Error("Insufficient balance");

    // Deduct bet
    user.balance -= betAmount;
    
    // Generate purely random seeds for record-keeping (fairness is less critical if client controls it)
    // But we still track them.
    const serverSeed = generateServerSeed();
    const clientSeed = req.body.clientSeed || generateClientSeed();
    const nonce = user.nonce || 0;
    user.nonce = nonce + 1;

    await user.save({ session });

    // Create ACTIVE game session
    const gameSessions = await GameSession.create([{
      user: user._id,
      gameType: 'PLINKO',
      betAmount,
      payout: 0, // Pending
      multiplier: 0, // Pending
      serverSeed,
      clientSeed,
      nonce,
      status: 'ACTIVE', // New status flagging incomplete
      state: { rows, risk } 
    }], { session });

    await session.commitTransaction();

    res.json({
      success: true,
      gameId: gameSessions[0]._id,
      balance: user.balance
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

exports.plinkoResult = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { gameId, bucketIndex } = req.body;

    const game = await GameSession.findById(gameId).populate('user').session(session);
    if (!game) throw new Error("Game not found");
    
    // Idempotency check: If already completed with same result, return success
    if (game.status === 'COMPLETED') {
        if (game.state.bucketIndex === bucketIndex) {
            await session.commitTransaction();
            return res.json({
                success: true,
                payout: game.payout,
                multiplier: game.multiplier,
                balance: game.user.balance // Use current user balance
            });
        }
        throw new Error("Game already completed");
    }

    // Retrieve configs
    const { rows, risk } = game.state;
    const table = PLINKO_MULTIPLIERS[rows];
    if (!table) throw new Error("Invalid game config rows");
    const multipliers = table[risk];
    
    if (bucketIndex < 0 || bucketIndex >= multipliers.length) {
       throw new Error("Invalid bucket index");
    }

    const multiplier = multipliers[bucketIndex];
    const payout = game.betAmount * multiplier;

    // Update User
    const user = game.user;
    user.balance += payout;
    await user.save({ session });

    // Update Game
    game.payout = payout;
    game.multiplier = multiplier;
    game.status = 'COMPLETED';
    game.state.bucketIndex = bucketIndex; 
    await game.save({ session });

    await session.commitTransaction();

    res.json({
      success: true,
      payout,
      multiplier,
      balance: user.balance
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};
