// controllers/games/blackjackController.js
const User = require('../../models/User');
const GameSession = require('../../models/GameSession');
const mongoose = require('mongoose');
const crypto = require('crypto');
const { 
  generateServerSeed, 
  generateClientSeed, 
  hashToNumber,
  hashServerSeed 
} = require('../../utils/provablyFair');

// Helper functions
const createDeck = () => {
  const suits = ['H', 'D', 'C', 'S'];
  const values = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  const deck = [];
  suits.forEach(s => values.forEach(v => deck.push({s, v})));
  return deck;
};

const shuffleDeck = (deck, seed) => {
  const shuffled = [...deck];
  for(let i = shuffled.length - 1; i > 0; i--) {
    const hash = crypto.createHash('sha256').update(seed + i.toString()).digest('hex');
    const j = hashToNumber(hash, i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const calculateHand = (hand) => {
  let sum = 0;
  let aces = 0;
  hand.forEach(card => {
    if(['J','Q','K'].includes(card.v)) sum += 10;
    else if (card.v === 'A') { sum += 11; aces++; }
    else sum += Number(card.v);
  });
  while(sum > 21 && aces > 0) {
    sum -= 10;
    aces--;
  }
  return sum;
};

// Initialize new blackjack game
exports.blackjackInit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { firebaseUID, betAmount } = req.body;
    
    // Validation
    if(!betAmount || betAmount <= 0) throw new Error("Invalid bet amount");

    const user = await User.findOne({ firebaseUID }).session(session);
    if(!user) throw new Error("User not found");
    if(user.balance < betAmount) throw new Error("Insufficient funds");

    // Deduct bet
    user.balance -= betAmount;
    await user.save({ session });

    // Generate provably fair seeds
    const serverSeed = generateServerSeed();
    const clientSeed = generateClientSeed();
    const nonce = 0;

    // Create and shuffle deck
    let deck = createDeck();
    deck = shuffleDeck(deck, serverSeed + clientSeed);

    // Deal initial cards (player, dealer, player, dealer)
    const playerHand = [deck.pop(), deck.pop()];
    const dealerHand = [deck.pop(), deck.pop()];
    
    const playerScore = calculateHand(playerHand);
    const dealerScore = calculateHand([dealerHand[0]]);

    // Check for natural blackjack
    let gameOver = false;
    let outcome = null;
    let payout = 0;

    if(playerScore === 21) {
      gameOver = true;
      const dealerTotal = calculateHand(dealerHand);
      if(dealerTotal === 21) {
        outcome = 'push';
        payout = betAmount; // Return bet
      } else {
        outcome = 'blackjack';
        payout = betAmount * 2.5; // 3:2 payout (1.5x win + original bet)
      }
      user.balance += payout;
      await user.save({ session });
    }

    // Create game session
    const game = await GameSession.create([{
      user: user._id,
      gameType: 'BLACKJACK',
      betAmount,
      serverSeed,
      clientSeed,
      nonce,
      payout: payout,
      state: { 
        deck, 
        playerHand, 
        dealerHand, 
        gameOver, 
        outcome 
      },
      isActive: !gameOver
    }], { session });

    await session.commitTransaction();
    
    // Prepare response (hide dealer's second card if game continues)
    const dealerVisible = gameOver ? dealerHand : [dealerHand[0]];
    
    res.json({ 
      success: true, 
      gameId: game[0]._id, 
      playerHand, 
      playerScore,
      dealerVisible,
      dealerScore: gameOver ? calculateHand(dealerHand) : dealerScore,
      balance: parseFloat(user.balance.toFixed(2)),
      gameOver,
      outcome,
      payout: parseFloat(payout.toFixed(2)),
      canDouble: playerHand.length === 2 && !gameOver,
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

// Hit - draw another card
exports.blackjackHit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { gameId } = req.body;
    
    if(!gameId) throw new Error("Game ID required");

    const game = await GameSession.findById(gameId).session(session);
    if(!game) throw new Error("Game not found");
    if(!game.isActive) throw new Error("Game not active");

    const deck = game.state.deck;
    const playerHand = game.state.playerHand;
    
    // Draw card
    playerHand.push(deck.pop());
    const playerScore = calculateHand(playerHand);

    let gameOver = false;
    let outcome = null;
    let payout = 0;

    // Check for bust
    if(playerScore > 21) {
      gameOver = true;
      outcome = 'bust';
      game.isActive = false;
      game.payout = 0;
    }

    game.state = { ...game.state, deck, playerHand, gameOver, outcome };
    await game.save({ session });
    await session.commitTransaction();
    
    res.json({ 
      success: true, 
      playerHand, 
      playerScore, 
      gameOver, 
      outcome,
      payout: parseFloat(payout.toFixed(2)),
      canDouble: false // Can't double after hitting
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

// Stand - dealer plays their hand
exports.blackjackStand = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { gameId } = req.body;
    
    if(!gameId) throw new Error("Game ID required");

    const game = await GameSession.findById(gameId).session(session);
    if(!game) throw new Error("Game not found");
    if(!game.isActive) throw new Error("Game not active");

    const deck = game.state.deck;
    const playerHand = game.state.playerHand;
    const dealerHand = game.state.dealerHand;
    
    let dealerScore = calculateHand(dealerHand);
    
    // Dealer hits on 16 or less, stands on 17 or more
    while(dealerScore < 17) {
      dealerHand.push(deck.pop());
      dealerScore = calculateHand(dealerHand);
    }

    const playerScore = calculateHand(playerHand);
    
    let payout = 0;
    let outcome = '';

    // Determine winner
    if(dealerScore > 21) {
      outcome = 'dealer_bust';
      payout = game.betAmount * 2; // Win + original bet
    } else if(playerScore > dealerScore) {
      outcome = 'win';
      payout = game.betAmount * 2;
    } else if (playerScore === dealerScore) {
      outcome = 'push';
      payout = game.betAmount; // Return bet
    } else {
      outcome = 'lose';
      payout = 0;
    }

    // Update user balance
    const user = await User.findById(game.user).session(session);
    user.balance += payout;
    await user.save({ session });

    // Update game
    game.isActive = false;
    game.payout = payout;
    game.state = { 
      ...game.state, 
      deck, 
      dealerHand, 
      gameOver: true, 
      outcome 
    };
    await game.save({ session });

    await session.commitTransaction();
    
    res.json({ 
      success: true, 
      dealerHand, 
      dealerScore, 
      playerScore, 
      outcome, 
      payout: parseFloat(payout.toFixed(2)),
      balance: parseFloat(user.balance.toFixed(2)),
      serverSeed: game.serverSeed
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

// Double down - double bet, get one card, then stand
exports.blackjackDouble = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { gameId } = req.body;
    
    if(!gameId) throw new Error("Game ID required");

    const game = await GameSession.findById(gameId).session(session);
    if(!game) throw new Error("Game not found");
    if(!game.isActive) throw new Error("Game not active");
    if(game.state.playerHand.length !== 2) throw new Error("Can only double on first move");

    const user = await User.findById(game.user).session(session);
    if(user.balance < game.betAmount) throw new Error("Insufficient funds to double");

    // Double the bet
    user.balance -= game.betAmount;
    game.betAmount *= 2;

    const deck = game.state.deck;
    const playerHand = game.state.playerHand;
    const dealerHand = game.state.dealerHand;
    
    // Hit once
    playerHand.push(deck.pop());
    const playerScore = calculateHand(playerHand);

    let payout = 0;
    let outcome = '';

    if(playerScore > 21) {
      // Bust
      outcome = 'bust';
      game.isActive = false;
    } else {
      // Dealer plays
      let dealerScore = calculateHand(dealerHand);
      while(dealerScore < 17) {
        dealerHand.push(deck.pop());
        dealerScore = calculateHand(dealerHand);
      }

      // Determine winner
      if(dealerScore > 21) {
        outcome = 'dealer_bust';
        payout = game.betAmount * 2;
      } else if(playerScore > dealerScore) {
        outcome = 'win';
        payout = game.betAmount * 2;
      } else if(playerScore === dealerScore) {
        outcome = 'push';
        payout = game.betAmount;
      } else {
        outcome = 'lose';
      }

      game.isActive = false;
    }

    user.balance += payout;
    await user.save({ session });

    game.payout = payout;
    game.state = { 
      ...game.state, 
      deck, 
      playerHand, 
      dealerHand, 
      gameOver: true, 
      outcome 
    };
    await game.save({ session });

    await session.commitTransaction();
    
    const dealerScore = calculateHand(dealerHand);
    
    res.json({ 
      success: true,
      playerHand,
      playerScore,
      dealerHand,
      dealerScore,
      outcome, 
      payout: parseFloat(payout.toFixed(2)),
      balance: parseFloat(user.balance.toFixed(2)),
      doubled: true,
      serverSeed: game.serverSeed
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

// Split (optional - for when player has two same cards)
exports.blackjackSplit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { gameId } = req.body;
    
    if(!gameId) throw new Error("Game ID required");

    const game = await GameSession.findById(gameId).session(session);
    if(!game) throw new Error("Game not found");
    if(!game.isActive) throw new Error("Game not active");
    if(game.state.playerHand.length !== 2) throw new Error("Can only split on first move");

    const playerHand = game.state.playerHand;
    
    // Check if cards have same value
    const card1Value = playerHand[0].v === 'A' ? 11 : (['J','Q','K'].includes(playerHand[0].v) ? 10 : Number(playerHand[0].v));
    const card2Value = playerHand[1].v === 'A' ? 11 : (['J','Q','K'].includes(playerHand[1].v) ? 10 : Number(playerHand[1].v));
    
    if(card1Value !== card2Value) throw new Error("Cards must have same value to split");

    const user = await User.findById(game.user).session(session);
    if(user.balance < game.betAmount) throw new Error("Insufficient funds to split");

    // Note: Full split implementation requires creating two separate hands
    // This is a simplified version that rejects splits for now
    throw new Error("Split feature coming soon");

  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

module.exports = {
  blackjackInit: exports.blackjackInit,
  blackjackHit: exports.blackjackHit,
  blackjackStand: exports.blackjackStand,
  blackjackDouble: exports.blackjackDouble,
  blackjackSplit: exports.blackjackSplit
};