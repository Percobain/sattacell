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

exports.coinFlip = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { firebaseUID, betAmount, choice } = req.body;
    if(betAmount <= 0) throw new Error("Invalid bet");
    if(!['heads', 'tails'].includes(choice)) throw new Error("Invalid choice");

    const user = await User.findOne({ firebaseUID }).session(session);
    if(!user || user.balance < betAmount) throw new Error("Insufficient funds");

    user.balance -= betAmount;
    
    const serverSeed = generateServerSeed();
    const clientSeed = generateClientSeed();
    const nonce = 0;
    
    const hash = generateGameResult(serverSeed, clientSeed, nonce);
    const result = hashToNumber(hash, 2) === 0 ? 'heads' : 'tails';
    
    const win = result === choice;
    const multiplier = win ? 1.98 : 0;
    const payout = win ? betAmount * multiplier : 0;

    if(win) {
      user.balance += payout;
    }

    await user.save({ session });

    await GameSession.create([{
      user: user._id,
      gameType: 'COINFLIP',
      betAmount,
      multiplier,
      payout,
      serverSeed,
      clientSeed,
      nonce,
      state: { choice, result, win },
      isActive: false
    }], { session });

    await session.commitTransaction();
    
    res.json({ 
      success: true, 
      result, 
      win, 
      payout: parseFloat(payout.toFixed(2)), 
      balance: parseFloat(user.balance.toFixed(2)),
      serverSeed,
      serverSeedHash: hashServerSeed(serverSeed),
      clientSeed
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

