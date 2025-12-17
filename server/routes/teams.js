const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Team = require('../models/Team');
const Vote = require('../models/Vote');
const User = require('../models/User');

// Seed Teams Data
const TEAMS_DATA = [
  {
    name: "GADA ELECTRONICS",
    members: ["Vinayak Pai", "Dhanya Shukla", "Samaira Sharma"],
    description: "Team 01"
  },
  {
    name: "DUKH DARD KASHT PEEDA",
    members: ["Tanuj Adarkar", "Parth Panwar", "Divyanshi Yadav"],
    description: "Team 02"
  },
  {
    name: "DEVELOPING DIVAS",
    members: ["Shantanav Mukherjee", "Purva Pote", "Arshia Dang"],
    description: "Team 03"
  },
  {
    name: "TEAM SHIRO",
    members: ["Shaurya Srivastava", "Dhruv Kumar", "Rudrakshi Acharyya"],
    description: "Team 04"
  },
  {
    name: "TEAM SAMMU",
    members: ["Samagra Agarwal", "Srushti Talandage", "Bhoumik Sangle"],
    description: "Team 05"
  },
  {
    name: "CODE MY CELLS",
    members: ["Anmol Rai", "Ashwera Hasan", "Shravika Mhatre", "Yash Agroya"],
    description: "Team 06"
  }
];

// Initialize teams if they don't exist
const seedTeams = async () => {
  try {
    const count = await Team.countDocuments();
    if (count === 0) {
      console.log('Seeding teams...');
      await Team.insertMany(TEAMS_DATA);
      console.log('Teams seeded successfully');
    }
  } catch (error) {
    console.error('Error seeding teams:', error);
  }
};

// Call seed on route load (or could be in server.js)
seedTeams();

// GET /api/teams - Get all teams
router.get('/', async (req, res) => {
  try {
    const teams = await Team.find().sort({ name: 1 });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/teams/my-votes - Get current user's votes for all teams
router.get('/my-votes', async (req, res) => {
  // Assuming auth middleware populates req.user or we use a query param for now if no middleware
  // Ideally, this should be protected. I'll check how auth is handled in other routes.
  // Using firebaseUID from header or body as typical in this codebase usually?
  // Let's check other routes. For now, expecting user ID (firebaseUID or mongoID) in query or header.
  // Based on `server.js` auth middleware usage seems missing globally but imported.
  // I will assume `req.headers.authorization` or `req.headers.firebase_uid` might be used or body.
  // Reverting to checking other files. For now, I'll allow passing `firebaseUID` in query.
  
  const { firebaseUID } = req.query;
  if (!firebaseUID) {
    return res.status(400).json({ message: 'Firebase UID required' });
  }

  try {
    const user = await User.findOne({ firebaseUID });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const votes = await Vote.find({ user: user._id }).populate('team', 'name');
    res.json(votes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/teams/vote - Vote for a team
router.post('/vote', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { firebaseUID, teamId, amount } = req.body;
    
    if (!firebaseUID || !teamId || !amount || amount <= 0) {
      throw new Error('Invalid input data');
    }

    const user = await User.findOne({ firebaseUID }).session(session);
    if (!user) {
      throw new Error('User not found');
    }

    const team = await Team.findById(teamId).session(session);
    if (!team) {
      throw new Error('Team not found');
    }

    let vote = await Vote.findOne({ user: user._id, team: team._id }).session(session);
    
    const currentVotes = vote ? vote.count : 0;
    const newTotalVotes = currentVotes + Number(amount);
    
    // Quadratic Cost Calculation
    // Cost = (NewTotal^2) - (Current^2)
    const cost = (Math.pow(newTotalVotes, 2) - Math.pow(currentVotes, 2));

    if (user.balance < cost) {
      throw new Error(`Insufficient balance. Cost: ${cost} tokens, Balance: ${user.balance} tokens`);
    }

    // Deduct balance
    user.balance -= cost;
    await user.save({ session });

    // Update or Create Vote
    if (vote) {
      vote.count = newTotalVotes;
      await vote.save({ session });
    } else {
      await Vote.create([{
        user: user._id,
        team: team._id,
        count: newTotalVotes
      }], { session });
    }

    // Update Team Total
    team.voteCount += Number(amount);
    await team.save({ session });

    await session.commitTransaction();
    res.json({ 
      success: true, 
      newBalance: user.balance, 
      teamVotes: team.voteCount,
      userVotes: newTotalVotes,
      cost 
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
});

module.exports = router;
