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

exports.rouletteSpin = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { firebaseUID, bets } = req.body;
    
    let totalBet = 0;
    bets.forEach(b => totalBet += b.amount);
    
    const user = await User.findOne({ firebaseUID }).session(session);
    if(!user || user.balance < totalBet) throw new Error("Insufficient funds");

    user.balance -= totalBet;

    const serverSeed = generateServerSeed();
    const clientSeed = generateClientSeed();
    const nonce = 0;
    
    const hash = generateGameResult(serverSeed, clientSeed, nonce);
    const resultNumber = hashToNumber(hash, 37);
    
    const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
    const blackNumbers = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];
    
    const isRed = redNumbers.includes(resultNumber);
    const isBlack = blackNumbers.includes(resultNumber);
    const isZero = resultNumber === 0;
    const resultColor = isZero ? 'green' : (isRed ? 'red' : 'black');
    const isEven = resultNumber !== 0 && resultNumber % 2 === 0;
    const isOdd = resultNumber !== 0 && resultNumber % 2 !== 0;

    let totalPayout = 0;
    const betResults = [];

    bets.forEach(bet => {
      let won = false;
      let multiplier = 0;

      switch(bet.type) {
        case 'number':
          if(Number(bet.value) === resultNumber) {
            won = true;
            multiplier = 35;
          }
          break;
        case 'color':
          if(bet.value === resultColor && !isZero) {
            won = true;
            multiplier = 1;
          }
          break;
        case 'parity':
          if(!isZero) {
             if((bet.value === 'even' && isEven) || (bet.value === 'odd' && isOdd)) {
               won = true;
               multiplier = 1;
             }
          }
          break;
        case 'dozen':
          if(!isZero) {
            if(bet.value === 1 && resultNumber >= 1 && resultNumber <= 12) { won = true; multiplier = 2; }
            if(bet.value === 2 && resultNumber >= 13 && resultNumber <= 24) { won = true; multiplier = 2; }
            if(bet.value === 3 && resultNumber >= 25 && resultNumber <= 36) { won = true; multiplier = 2; }
          }
          break;
        case 'column':
          if(!isZero) {
            // Column 1: 1, 4, 7... (val % 3 === 1)
            // Column 2: 2, 5, 8... (val % 3 === 2)
            // Column 3: 3, 6, 9... (val % 3 === 0)
            const colRemainder = resultNumber % 3;
            // Map 0 remainder to column 3 for easier check
            const actualCol = colRemainder === 0 ? 3 : colRemainder;
            
            if(bet.value === actualCol) {
              won = true;
              multiplier = 2;
            }
          }
          break;
        case 'low':
          if(!isZero && resultNumber >= 1 && resultNumber <= 18) {
             won = true;
             multiplier = 1;
          }
          break;
        case 'high':
          if(!isZero && resultNumber >= 19 && resultNumber <= 36) {
             won = true;
             multiplier = 1;
          }
          break;
      }
      
      const betPayout = won ? bet.amount * (multiplier + 1) : 0;
      totalPayout += betPayout;
      betResults.push({ ...bet, won, payout: betPayout });
    });

    user.balance += totalPayout;
    await user.save({ session });
    
    await GameSession.create([{
      user: user._id,
      gameType: 'ROULETTE',
      betAmount: totalBet,
      payout: totalPayout,
      serverSeed,
      clientSeed,
      nonce,
      state: { resultNumber, resultColor, bets: betResults },
      isActive: false
    }], { session });

    await session.commitTransaction();
    
    res.json({ 
      success: true, 
      resultNumber, 
      resultColor, 
      totalPayout: parseFloat(totalPayout.toFixed(2)), 
      balance: parseFloat(user.balance.toFixed(2)),
      betResults,
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