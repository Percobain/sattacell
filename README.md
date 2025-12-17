# SattaCell

A prediction market platform, implementing the **Logarithmic Market Scoring Rule (LMSR)** for automated market making. Created for fun and for **CodeCell Intra Hack 2025**.

![SattaCell](https://img.shields.io/badge/SattaCell-Prediction%20Markets-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Hackathon](https://img.shields.io/badge/Hackathon-CodeCell%20Intra%20Hack%202025-orange)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [The Mathematics Behind LMSR](#the-mathematics-behind-lmsr)
- [System Architecture](#system-architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Usage](#usage)
- [Contributing](#contributing)
- [Acknowledgments](#acknowledgments)

## Overview

**SattaCell** is a centralized prediction market platform inspired by Polymarket, where users can trade shares on various outcomes using a fake token system. The platform uses the **Logarithmic Market Scoring Rule (LMSR)** as its Automated Market Maker (AMM) to automatically price shares and calculate probabilities based on market activity.

### What is a Prediction Market?

A prediction market is a platform where users can buy and sell shares in the outcome of future events. The price of shares represents the market's collective probability estimate of that outcome occurring. For example, if shares for "Team A wins" are trading at 70%, the market believes there's a 70% chance Team A will win.

### Why LMSR?

The Logarithmic Market Scoring Rule ensures:
- **Liquidity**: There's always a price to buy or sell shares
- **No Order Books**: Prices are calculated automatically based on a mathematical formula
- **Fair Pricing**: Prices reflect the true market probability
- **Atomic Trades**: All trades are executed atomically and safely

## Features

### Core Features
- **Market Creation**: Admins can create prediction markets with multiple outcomes
- **Trading**: Buy and sell shares in market outcomes using fake tokens
- **Real-time Probabilities**: Dynamic probability calculation using LMSR
- **User Positions**: Track your holdings across all markets
- **Analytics Dashboard**: Comprehensive market analytics with 10+ visualizations
- **Authentication**: Google OAuth restricted to `@somaiya.edu` emails
- **Admin Panel**: Password-protected admin interface for market management

### Advanced Features
- **10 Interactive Charts**: 
  - Top Position Holders
  - Top Traders by Volume
  - Top Holders by Outcome
  - Position Concentration
  - Most Active Traders
  - Recent Activity by Top Holders
  - Probability vs Volume Scatter Plot
  - Cumulative Trading Volume
  - Buy vs Sell by Outcome
  - Buy/Sell Ratio Pie Chart
- **Trade History**: Complete transaction history with user names
- **Orderbook**: View all user positions in a market
- **Market Analytics**: Leading outcomes, volume metrics, trader statistics
- **Token Management**: Initial 1000 tokens per user, admin can grant more

## Tech Stack

### Backend
- **Node.js** + **Express.js**: RESTful API server
- **MongoDB** + **Mongoose**: Database and ODM
- **Google OAuth**: Authentication (direct GCP integration)
- **LMSR Service**: Core pricing algorithm implementation

### Frontend
- **React 19**: Modern UI framework
- **Vite**: Fast build tool and dev server
- **React Router**: Client-side routing
- **Recharts**: Data visualization library
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: Beautiful component library
- **Lucide React**: Icon library

### Analytics & Monitoring
- **Vercel Analytics**: Performance tracking
- **Microsoft Clarity**: User behavior analytics

## The Mathematics Behind LMSR

The **Logarithmic Market Scoring Rule (LMSR)** is a mathematical mechanism for pricing shares in prediction markets. It was developed by Robin Hanson and ensures liquidity and fair pricing.

### Core Formulas

#### 1. Weight Calculation
For each outcome `i`, the weight is calculated as:

```
weight_i = exp(q_i / b)
```

Where:
- `q_i` = Current state vector (quantity of shares) for outcome `i`
- `b` = Liquidity parameter (controls price sensitivity, default: 100)
- `exp()` = Exponential function

#### 2. Probability Calculation
The probability of outcome `i` is:

```
P_i = weight_i / Σ(weight_j)
```

This normalizes weights so probabilities sum to 1.

#### 3. Cost Function
The total cost of the current market state is:

```
C(q) = b * ln(Σ(exp(q_i / b)))
```

Where `ln()` is the natural logarithm.

#### 4. Trade Cost
When a user buys or sells shares, the cost is:

```
cost = C(q_after) - C(q_before)
```

- **Positive cost** = User pays tokens (buying shares)
- **Negative cost** = User receives tokens (selling shares)

### Real-World Example: Step-by-Step

Let's walk through a complete example with actual numbers from the platform:

#### Initial State
- Market: "Will it rain tomorrow?" with outcomes ["Yes", "No"]
- Initial state: `q = [0, 0]` (no shares outstanding)
- Liquidity parameter: `b = 100`
- Initial probabilities: 50% / 50% (equal)

#### Trade 1: Buying 100 shares of "Yes"

**Before Trade:**
```
q = [0, 0]
C([0, 0]) = 100 × ln(exp(0/100) + exp(0/100))
         = 100 × ln(1 + 1)
         = 100 × ln(2)
         = 100 × 0.693
         = 69.31 tokens
```

**After Trade:**
```
q = [100, 0]  (added 100 shares to "Yes")
C([100, 0]) = 100 × ln(exp(100/100) + exp(0/100))
            = 100 × ln(exp(1) + exp(0))
            = 100 × ln(2.718 + 1)
            = 100 × ln(3.718)
            = 100 × 1.315
            = 131.5 tokens
```

**Cost:**
```
Cost = 131.5 - 69.31 = 62.19 tokens
```

**New Probabilities:**
```
weight_yes = exp(100/100) = exp(1) = 2.718
weight_no = exp(0/100) = exp(0) = 1.0
sum = 3.718

P_yes = 2.718 / 3.718 = 0.731 = 73.1%
P_no = 1.0 / 3.718 = 0.269 = 26.9%
```

**Result:**
- User pays: **62.19 tokens**
- User receives: **100 shares of "Yes"**
- If "Yes" wins: User gets **100 tokens** (1 token per share)
- Profit if wins: **100 - 62.19 = 37.81 tokens** (60.8% return)

#### Trade 2: Buying 100 shares of "No" (after Trade 1)

**Before Trade:**
```
q = [100, 0]  (from previous trade)
C([100, 0]) = 131.5 tokens (calculated above)
```

**After Trade:**
```
q = [100, 100]  (added 100 shares to "No")
C([100, 100]) = 100 × ln(exp(100/100) + exp(100/100))
              = 100 × ln(exp(1) + exp(1))
              = 100 × ln(2.718 + 2.718)
              = 100 × ln(5.436)
              = 100 × 1.693
              = 169.3 tokens
```

**Cost:**
```
Cost = 169.3 - 131.5 = 37.8 tokens
```

**New Probabilities:**
```
weight_yes = exp(100/100) = 2.718
weight_no = exp(100/100) = 2.718
sum = 5.436

P_yes = 2.718 / 5.436 = 0.5 = 50.0%
P_no = 2.718 / 5.436 = 0.5 = 50.0%
```

**Result:**
- User pays: **37.8 tokens**
- User receives: **100 shares of "No"**
- If "No" wins: User gets **100 tokens** (1 token per share)
- Profit if wins: **100 - 37.8 = 62.2 tokens** (164.6% return)
- Market rebalances to **50/50** (equal shares = equal probabilities)

### Key Insights

1. **Price Impact (Slippage)**: 
   - Buying shares increases the price of that outcome
   - The first 100 "Yes" shares cost 62.19 tokens
   - The first 100 "No" shares cost only 37.8 tokens (cheaper because "No" was at 26.9%)

2. **Why Costs Differ from Simple Estimates**:
   - Simple estimate: `100 shares × 50% = 50 tokens` 
   - Actual LMSR cost: `62.19 tokens` 
   - The difference (12.19 tokens) is the **price impact** or **slippage**

3. **Market Rebalancing**:
   - When both outcomes have equal shares (`q = [100, 100]`), probabilities return to 50/50
   - This is the **equilibrium state** of the market

4. **Profit Calculation**:
   - Each share pays **1 token** if the outcome wins
   - Profit = `(Shares × 1) - Cost Paid`
   - Example: 100 shares cost 62.19 tokens, win = 100 tokens, profit = 37.81 tokens

### Why LMSR Works

1. **Automatic Pricing**: No need for order books or matching buyers/sellers
2. **Liquidity**: Always a price available (though it may be expensive for large orders)
3. **Fairness**: Prices reflect true market probabilities and account for market depth
4. **Price Discovery**: Probabilities automatically adjust based on trading activity
5. **Atomic**: All trades are executed atomically using MongoDB transactions
6. **Scalable**: Works with any number of outcomes

### UI Implementation

The platform calculates **actual LMSR costs** in real-time, not simple estimates:
- Uses current market state (`q` array)
- Accounts for liquidity parameter (`b`)
- Shows exact cost you'll pay
- Updates probabilities after each trade

### Trade Flow (Atomic & Safe)

1. Fetch current market state (`q` vector)
2. Calculate LMSR cost **BEFORE** trade
3. Apply delta to selected outcome
4. Calculate LMSR cost **AFTER** trade
5. Deduct/add tokens from user balance
6. Update outcome shares in market state
7. Record trade in database
8. Return updated probabilities

All steps are wrapped in a MongoDB transaction to ensure atomicity.

## System Architecture

```
┌─────────────────┐
│   React Client  │
│   (Frontend)    │
└────────┬────────┘
         │ HTTP/REST
         │
┌────────▼────────┐
│  Express API   │
│   (Backend)    │
└────────┬────────┘
         │
    ┌────┴────┐
    │        │
┌───▼───┐ ┌──▼────┐
│MongoDB│ │Google │
│       │ │ OAuth │
└───────┘ └───────┘
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Google Cloud Project with OAuth credentials
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone git@github.com:Percobain/sattacell.git
cd sattacell
```

2. **Install backend dependencies**
```bash
cd server
npm install
```

3. **Install frontend dependencies**
```bash
cd ../client
npm install
```

4. **Set up environment variables**

Create `server/.env`:
```env
MONGODB_URI=your_mongodb_connection_string
PORT=3000
ADMIN_PASSWORD=your_secure_admin_password

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback
GOOGLE_REDIRECT_URI_PROD=https://your-production-url.com/auth/callback
```

Create `client/.env`:
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_API_URL=http://localhost:3000/api
VITE_CLARITY_PROJECT_ID=your_clarity_project_id
```

5. **Set up Google OAuth**

- Go to [Google Cloud Console](https://console.cloud.google.com)
- Create OAuth 2.0 credentials
- Add authorized redirect URIs:
  - `http://localhost:5173/auth/callback` (development)
  - `https://your-production-url.com/auth/callback` (production)
- Restrict to `@somaiya.edu` domain in OAuth consent screen

6. **Set up admin user**

```bash
cd server
npm run set-admin
# Edit scripts/setAdmin.js to set your email
```

7. **Start the development servers**

Backend:
```bash
cd server
npm run dev
```

Frontend:
```bash
cd client
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
sattacell/
├── server/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── models/
│   │   ├── User.js              # User schema
│   │   ├── Market.js            # Market schema
│   │   └── Trade.js             # Trade schema
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── markets.js           # Market CRUD + analytics
│   │   ├── trades.js            # Trade execution
│   │   ├── users.js             # User endpoints
│   │   └── admin.js             # Admin endpoints
│   ├── services/
│   │   ├── lmsrService.js       # LMSR calculations
│   │   ├── tradeService.js      # Trade execution logic
│   │   └── settlementService.js # Market settlement
│   ├── middleware/
│   │   ├── auth.js              # Authentication middleware
│   │   └── admin.js             # Admin protection
│   ├── utils/
│   │   ├── googleAuth.js        # Google OAuth utilities
│   │   └── errors.js            # Error handling
│   └── server.js                # Express app entry point
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── markets/         # Market components
│   │   │   ├── trading/         # Trading components
│   │   │   ├── admin/          # Admin components
│   │   │   └── ui/             # UI components
│   │   ├── hooks/
│   │   │   ├── useAuth.js      # Auth hook
│   │   │   ├── useMarkets.js   # Markets hook
│   │   │   └── useTrades.js    # Trades hook
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── MarketPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   └── AdminPage.jsx
│   │   ├── services/
│   │   │   └── api.js          # API client
│   │   └── App.jsx
│   └── public/
│       └── logo.png
│
└── README.md
```

## API Documentation

### Authentication
- `GET /api/auth/google` - Get Google OAuth URL
- `POST /api/auth/callback` - Exchange code for tokens
- `GET /api/auth/me` - Get current user

### Markets
- `GET /api/markets` - List all markets
- `GET /api/markets/:id` - Get market details
- `GET /api/markets/:id/analytics` - Get market analytics
- `GET /api/markets/:id/orderbook` - Get orderbook
- `GET /api/markets/:id/history` - Get trade history
- `POST /api/markets` - Create market (admin only)

### Trades
- `POST /api/trades` - Execute a trade

### Users
- `GET /api/users/balance` - Get user balance
- `GET /api/users/portfolio` - Get user portfolio

### Admin
- `POST /api/admin/settle` - Settle a market
- `POST /api/admin/grant-tokens` - Grant tokens to user

## Usage

### For Users

1. **Sign In**: Click "Sign in with Google" (must use `@somaiya.edu` email)
2. **Browse Markets**: View all open markets on the home page
3. **View Market**: Click on a market to see probabilities and analytics
4. **Trade**: Use the trading panel to buy/sell shares
5. **Track Positions**: View your positions in "Your Positions" section
6. **View History**: See all trades in the trade history section

### For Admins

1. **Access Admin Panel**: Navigate to `/admin` and enter admin password
2. **Create Markets**: Use "Create Market" tab to add new prediction markets
3. **Settle Markets**: After an event, settle the market and select the winning outcome
4. **Grant Tokens**: Send additional tokens to users if needed

## Features Showcase

### Market Analytics
- **10 Interactive Charts**: Visualize market dynamics
- **Real-time Updates**: Probabilities update as trades occur
- **People-focused**: See who's leading, who's trading most, etc.

### Trading Experience
- **Instant Execution**: Trades execute atomically
- **Cost Preview**: See estimated cost before trading
- **Position Tracking**: Monitor your holdings across markets

### Admin Tools
- **Market Management**: Create and settle markets
- **Token Distribution**: Grant tokens to users
- **Password Protection**: Secure admin access

## Contributing

This project was created for **CodeCell Intra Hack 2025** and is primarily for fun and learning. However, contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Acknowledgments

- **CodeCell Intra Hack 2025** - For the hackathon opportunity
- **Robin Hanson** - For developing the LMSR mechanism
- **Polymarket** - For inspiration on prediction market UX

## License

This project is created for educational purposes and the CodeCell Intra Hack 2025. Feel free to use and modify as needed.

## Future Enhancements

Potential improvements for future versions:
- Real-time WebSocket updates
- Historical probability charts
- User reputation system
- Market categories and tags
- Mobile app
- Social features (following traders, comments)
- Advanced analytics and predictions

---

**Made with ❤️ for CodeCell Intra Hack 2025**

*"Predicting the future, one trade at a time."*

