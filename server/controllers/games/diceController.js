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

exports.diceRoll = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { firebaseUID, betAmount, targetNumber, condition } = req.body;
    
    if(betAmount <= 0) throw new Error("Invalid bet");
    if(targetNumber < 0.01 || targetNumber > 99.99) throw new Error("Invalid target");
    if(!['over', 'under'].includes(condition)) throw new Error("Invalid condition");

    const user = await User.findOne({ firebaseUID }).session(session);
    if(!user || user.balance < betAmount) throw new Error("Insufficient funds");

    user.balance -= betAmount;

    const serverSeed = generateServerSeed();
    const clientSeed = generateClientSeed();
    const nonce = 0;
    
    const hash = generateGameResult(serverSeed, clientSeed, nonce);
    const roll = (hashToNumber(hash, 10000) / 100);

    let win = false;
    let winChance = 0;

    if(condition === 'over') {
      win = roll > targetNumber;
      winChance = 100 - targetNumber;
    } else {
      win = roll < targetNumber;
      winChance = targetNumber;
    }

    const multiplier = win ? (99 / winChance) : 0;
    const payout = win ? betAmount * multiplier : 0;

    if(win) user.balance += payout;
    await user.save({ session });

    await GameSession.create([{
      user: user._id,
      gameType: 'DICE',
      betAmount,
      multiplier,
      payout,
      serverSeed,
      clientSeed,
      nonce,
      state: { targetNumber, condition, roll: parseFloat(roll.toFixed(2)), win, winChance },
      isActive: false
    }], { session });

    await session.commitTransaction();
    
    res.json({ 
      success: true, 
      roll: parseFloat(roll.toFixed(2)), 
      win, 
      payout: parseFloat(payout.toFixed(2)), 
      balance: parseFloat(user.balance.toFixed(2)), 
      multiplier: parseFloat(multiplier.toFixed(4)),
      winChance: parseFloat(winChance.toFixed(2)),
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
