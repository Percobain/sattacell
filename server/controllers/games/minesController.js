const User = require('../../models/User');
const GameSession = require('../../models/GameSession');
const mongoose = require('mongoose');
const crypto = require('crypto');
const { 
  generateServerSeed, 
  generateClientSeed, 
  generateGameResult, 
  hashToNumber,
  hashServerSeed 
} = require('../../utils/provablyFair');

exports.minesStart = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { firebaseUID, betAmount, minesCount } = req.body;
    
    if (minesCount < 1 || minesCount > 24) throw new Error("Invalid mines count (1-24)");
    if (betAmount <= 0) throw new Error("Invalid bet amount");

    const user = await User.findOne({ firebaseUID }).session(session);
    if (!user) throw new Error("User not found");
    if (user.balance < betAmount) throw new Error("Insufficient balance");

    user.balance -= betAmount;
    await user.save({ session });

    const serverSeed = generateServerSeed();
    const clientSeed = generateClientSeed();
    const nonce = 0;

    const hash = generateGameResult(serverSeed, clientSeed, nonce);
    const mineLocations = [];
    let index = 0;
    
    while(mineLocations.length < minesCount) {
      const subHash = crypto.createHash('sha256')
        .update(hash + index.toString())
        .digest('hex');
      const loc = hashToNumber(subHash, 25);
      if(!mineLocations.includes(loc)) {
        mineLocations.push(loc);
      }
      index++;
    }

    const game = await GameSession.create([{
      user: user._id,
      gameType: 'MINES',
      betAmount,
      serverSeed,
      clientSeed,
      nonce,
      state: {
        minesCount,
        mineLocations,
        revealedTiles: [],
        gameOver: false,
        multiplier: 1.0
      },
      multiplier: 1.0,
      isActive: true
    }], { session });

    await session.commitTransaction();
    
    const clientState = {
      minesCount,
      revealedTiles: [],
      gameOver: false,
      multiplier: 1.0
    };

    res.json({ 
      success: true, 
      gameId: game[0]._id, 
      state: clientState, 
      balance: user.balance,
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

exports.minesClick = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { gameId, tileIndex } = req.body;
    const game = await GameSession.findById(gameId).session(session);
    if(!game || !game.isActive) throw new Error("Game not active");

    if(game.state.revealedTiles.includes(tileIndex)) throw new Error("Tile already revealed");

    const isMine = game.state.mineLocations.includes(tileIndex);
    const newRevealed = [...game.state.revealedTiles, tileIndex];
    
    if (isMine) {
      game.isActive = false;
      game.state = { 
        ...game.state, 
        revealedTiles: newRevealed, 
        gameOver: true 
      };
      game.payout = 0;
      await game.save({ session });
      await session.commitTransaction();
      
      res.json({ 
        success: true, 
        gameOver: true, 
        win: false, 
        mineLocations: game.state.mineLocations,
        serverSeed: game.serverSeed,
        payout: 0
      });
    } else {
      const totalTiles = 25;
      const mines = game.state.minesCount;
      const revealedCount = newRevealed.length;
      
      let multiplier = 1;
      for(let i = 0; i < revealedCount; i++) {
        const tilesRemaining = totalTiles - i;
        const safeRemaining = totalTiles - mines - i;
        multiplier *= (tilesRemaining / safeRemaining);
      }
      
      multiplier = multiplier * 0.99;

      game.state = { 
        ...game.state, 
        revealedTiles: newRevealed,
        multiplier 
      };
      game.multiplier = multiplier;
      await game.save({ session });
      await session.commitTransaction();

      res.json({ 
        success: true, 
        gameOver: false, 
        multiplier: parseFloat(multiplier.toFixed(2)), 
        currentPayout: parseFloat((game.betAmount * multiplier).toFixed(2)),
        revealedTiles: newRevealed
      });
    }

  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

exports.minesCashout = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { gameId } = req.body;
    const game = await GameSession.findById(gameId).session(session);
    if(!game || !game.isActive) throw new Error("Game not active");
    if(game.state.revealedTiles.length === 0) throw new Error("Reveal at least one tile");

    const payout = game.betAmount * game.multiplier;
    
    game.isActive = false;
    game.payout = payout;
    game.state = { ...game.state, gameOver: true };
    await game.save({ session });

    const user = await User.findById(game.user).session(session);
    user.balance += payout;
    await user.save({ session });
    
    await session.commitTransaction();
    res.json({ 
      success: true, 
      payout: parseFloat(payout.toFixed(2)), 
      balance: parseFloat(user.balance.toFixed(2)), 
      mineLocations: game.state.mineLocations,
      serverSeed: game.serverSeed
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};