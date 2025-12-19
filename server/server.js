require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/database');
const { errorHandler } = require('./utils/errors');
const { Server } = require('socket.io');

// Routes
const authRoutes = require('./routes/auth');
const marketRoutes = require('./routes/markets');
const tradeRoutes = require('./routes/trades');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const teamRoutes = require('./routes/teams');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/markets', marketRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teams', teamRoutes);

// Error handler
app.use(errorHandler);

// Create HTTP server and attach Socket.IO for realtime updates
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
});

// Make Socket.IO instance available in routes via app
app.set('io', io);

// Initialize Realtime Service
const { initRealtimeService } = require('./services/realtimeService');
const changeStream = initRealtimeService(io);

io.on('connection', (socket) => {
  console.log('Client connected', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Handle graceful shutdown for change stream?
process.on('SIGINT', async () => {
  await changeStream.close();
  process.exit(0);
});
