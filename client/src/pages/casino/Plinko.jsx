import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Disc, Settings, DollarSign, Zap, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import logo from "/CodeCell Logo White.png";
import { LoginButton } from "@/components/auth/LoginButton";

// --- Configuration Constants ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 800;
const START_X = CANVAS_WIDTH / 2;
const START_Y = 50;
const PIN_RADIUS = 3;
const BALL_RADIUS = 6;
const GRAVITY = 0.3;
const BOUNCE_DAMPING = 0.65; // Energy lost on bounce
const HORIZONTAL_FRICTION = 0.985; // Slightly higher friction

// Colors
const PIN_COLOR = 'rgba(255, 255, 255, 0.2)';
const BALL_COLOR = '#ec4899'; // Pink-500

const MULTIPLIERS = {
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

export const Plinko = () => {
  const { userData, refetchUserData } = useAuth();
  const canvasRef = useRef(null);
  
  // Game State
  const [betAmount, setBetAmount] = useState(10);
  const [risk, setRisk] = useState('medium');
  const [rows, setRows] = useState(16);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [lastWin, setLastWin] = useState(null);
  
  // Visual Balance State (to prevent spoilers)
  const [visualBalance, setVisualBalance] = useState(userData?.balance || 0);
  const [activeBallCount, setActiveBallCount] = useState(0);

  // Sync visual balance when idle
  useEffect(() => {
    if (activeBallCount === 0 && userData) {
      setVisualBalance(userData.balance);
    }
  }, [userData, activeBallCount]);

  // Physics State (Refs for performance)
  const ballsRef = useRef([]); // Stores active balls
  const pinsRef = useRef([]); // Stores pin positions
  const bucketHitsRef = useRef({}); // Stores hit timestamps for buckets: { [index]: timestamp }
  const animationRef = useRef(null);

  // 1) Build and cache pin positions when rows change
  useEffect(() => {
    const spacing = CANVAS_WIDTH / (rows + 5);
    const pins = []; // array of { id, x, y, row, col }
    for (let r = 0; r < rows; r++) {
      const pinsInRow = r + 3;
      const y = START_Y + r * 35;
      const rowWidth = (pinsInRow - 1) * spacing;
      const xStart = (CANVAS_WIDTH - rowWidth) / 2;
      for (let c = 0; c < pinsInRow; c++) {
        const x = xStart + c * spacing;
        pins.push({ id: `${r}-${c}`, x, y, row: r, col: c });
      }
    }
    pinsRef.current = pins;
  }, [rows]);

  // Initialize Canvas & Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const render = () => {
      // Clear Canvas
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Draw Pins (Pyramid)
      drawPins(ctx);
      
      // Update and Draw Balls
      updateBalls(ctx);
      
      // Draw Buckets (Multipliers)
      drawBuckets(ctx, rows, risk);

      animationRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationRef.current);
  }, [rows, risk]);

  const drawPins = (ctx) => {
    ctx.fillStyle = PIN_COLOR;
    const pins = pinsRef.current || [];
    for (const p of pins) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, PIN_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawBuckets = (ctx, rowCount, riskLevel) => {
    const multipliers = MULTIPLIERS[rowCount][riskLevel];
    const spacing = CANVAS_WIDTH / (rowCount + 5);
    const y = START_Y + rowCount * 35 + 20;
    
    const bucketCount = multipliers.length;
    const totalWidth = bucketCount * spacing;
    const xStart = (CANVAS_WIDTH - totalWidth) / 2 + (spacing / 2);

    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const now = Date.now();

    multipliers.forEach((m, i) => {
      const x = xStart + (i - 0.5) * spacing;
      
      let baseColor = '#fbbf24';
      if (m >= 10) baseColor = '#f97316';
      if (m >= 50) baseColor = '#ef4444';
      if (m < 1) baseColor = '#3f3f46';
      if (m >= 1 && m < 3) baseColor = '#a1a1aa';

      const lastHit = bucketHitsRef.current[i];
      const isHit = lastHit && (now - lastHit < 200);
      
      ctx.fillStyle = isHit ? '#ffffff' : baseColor;
      
      const w = spacing - 4;
      const h = 30;
      const bx = x - spacing/2 + 2;
      
      ctx.beginPath();
      ctx.roundRect(bx, y, w, h, 4);
      ctx.fill();
      
      if (m >= 10 && !isHit) {
         ctx.shadowColor = baseColor;
         ctx.shadowBlur = 10;
         ctx.stroke();
         ctx.shadowBlur = 0;
      }

      ctx.fillStyle = (isHit || m < 1) ? '#000000' : '#000000'; 
      if (!isHit && m >= 10) ctx.fillStyle = '#ffffff';
      if (!isHit && m < 1) ctx.fillStyle = '#ffffff';

      ctx.fillText(`${m}x`, x, y + 15);
    });
  };

  // REALISTIC PHYSICS: This creates a natural bell curve distribution
  const updateBalls = (ctx) => {
    const pins = pinsRef.current || [];
    const spacing = CANVAS_WIDTH / (rows + 5);
    const multipliers = MULTIPLIERS[rows][risk];
    const bucketCount = multipliers.length;
    const bucketWidth = spacing;
    const totalWidth = bucketCount * bucketWidth;
    const bucketXStart = (CANVAS_WIDTH - totalWidth) / 2;

    for (let bi = ballsRef.current.length - 1; bi >= 0; bi--) {
      const ball = ballsRef.current[bi];

      if (!ball.collidedPins) ball.collidedPins = new Set();

      // Apply gravity and friction
      ball.vy += GRAVITY;
      ball.vx *= HORIZONTAL_FRICTION;

      // Cap velocity to prevent tunneling
      const MAX_SPEED = 10;
      ball.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, ball.vx));
      ball.vy = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, ball.vy));

      // Integrate position
      ball.x += ball.vx;
      ball.y += ball.vy;

      // REALISTIC COLLISION PHYSICS
      for (let p of pins) {
        if (ball.collidedPins.has(p.id)) continue;

        const dx = ball.x - p.x;
        const dy = ball.y - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= (BALL_RADIUS + PIN_RADIUS)) {
          ball.collidedPins.add(p.id);

          // Normal vector from pin to ball
          const nx = dx / (dist || 1);
          const ny = dy / (dist || 1);

          // Reflect velocity
          const vDotN = ball.vx * nx + ball.vy * ny;
          ball.vx = ball.vx - 2 * vDotN * nx;
          ball.vy = ball.vy - 2 * vDotN * ny;

          // Apply damping
          ball.vx *= BOUNCE_DAMPING;
          ball.vy *= BOUNCE_DAMPING;

          // ============================================
          // REALISTIC PHYSICS FOR BELL CURVE DISTRIBUTION
          // ============================================
          
          // 1. SUBTLE CENTER GRAVITY: Slight pull toward center
          //    Balanced to feel fair while creating natural distribution
          const distFromCenter = ball.x - (CANVAS_WIDTH / 2);
          const centerForce = -distFromCenter * 0.012; // Balanced center pull
          ball.vx += centerForce;
          
          // 2. NATURAL RANDOM JITTER: Simulates real pin bounces
          //    More randomness = more varied outcomes
          ball.vx += (Math.random() - 0.5) * 0.5; // Natural bounce variation
          ball.vy += (Math.random() - 0.5) * 0.3; // Downward variation
          
          // 3. MILD VELOCITY DAMPENING based on distance from center
          //    Subtle energy loss at extremes (feels more fair)
          const distanceRatio = Math.abs(distFromCenter) / (CANVAS_WIDTH / 2);
          const extraDamping = 1 - (distanceRatio * 0.08); // Up to 8% extra damping at edges
          ball.vx *= extraDamping;

          // Push ball outside pin to prevent sticking
          const overlap = (BALL_RADIUS + PIN_RADIUS) - dist;
          ball.x += nx * overlap;
          ball.y += ny * overlap;
        }
      }

      // ANGLED WALL COLLISIONS (following pyramid shape)
      const currentRowFloat = (ball.y - START_Y) / 35; 
      const halfWidthAtRow = ((currentRowFloat + 2) * spacing) / 2; 
      const wallOffset = halfWidthAtRow + spacing * 0.9; // More room at edges
      
      const minX = (CANVAS_WIDTH / 2) - wallOffset;
      const maxX = (CANVAS_WIDTH / 2) + wallOffset;

      if (ball.x - BALL_RADIUS < minX) {
        ball.x = minX + BALL_RADIUS;
        // Wall bounce with angle (pushes toward center)
        ball.vx = Math.abs(ball.vx) * BOUNCE_DAMPING * 0.85;
        ball.vy *= 0.92; // Lose some downward momentum
      } else if (ball.x + BALL_RADIUS > maxX) {
        ball.x = maxX - BALL_RADIUS;
        ball.vx = -Math.abs(ball.vx) * BOUNCE_DAMPING * 0.85;
        ball.vy *= 0.92;
      }

      // Bucket detection
      const bucketZoneY = START_Y + rows * 35 + 10;
      if (ball.y > bucketZoneY && !ball.settled) {
        const relativeX = ball.x - bucketXStart;
        let bucketIndex = Math.floor(relativeX / bucketWidth);
        bucketIndex = Math.max(0, Math.min(bucketCount - 1, bucketIndex));

        ball.finalBucket = bucketIndex;
        ball.multiplier = multipliers[bucketIndex];
        ball.settled = true;
        
        bucketHitsRef.current[bucketIndex] = Date.now();
      }

      // Remove ball after settling
      const endY = START_Y + rows * 35 + 80;
      if (ball.settled && ball.y > endY) {
        if (ball.callSent) continue;
        ball.callSent = true;

        // Confetti for big wins
        if (ball.multiplier >= 10) {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.8 } });
        }
        
        ballsRef.current.splice(bi, 1);
        
        // Call result API
        if (ball.gameId) {
             api.post('/casino/plinko/result', {
                 gameId: ball.gameId,
                 bucketIndex: ball.finalBucket
             }).then(res => {
                 if (res.success) {
                    setLastWin({
                        multiplier: res.multiplier,
                        payout: res.payout
                    });
                    setVisualBalance(res.balance);
                    setActiveBallCount(prev => Math.max(0, prev - 1));
                    refetchUserData();
                 }
             }).catch(err => {
                 console.error("Result Error:", err);
                 setActiveBallCount(prev => Math.max(0, prev - 1));
             });
        }
        
        continue;
      }

      // Draw ball
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = BALL_COLOR;
      ctx.shadowBlur = 8;
      ctx.shadowColor = BALL_COLOR;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  };

  const dropBall = async () => {
    if(loading || !userData || userData.balance < betAmount) return;
    
    try {
      setError('');
      
      // Optimistically update
      setVisualBalance(prev => prev - betAmount);
      setActiveBallCount(prev => prev + 1);

      const res = await api.post('/casino/plinko/bet', {
        firebaseUID: userData?.firebaseUID, 
        betAmount, 
        rows, 
        risk 
      });
      
      if(res.success) {
        // Moderate random start for variety
        const startNoise = (Math.random() - 0.5) * 8;
        
        ballsRef.current.push({
          x: START_X + startNoise,
          y: START_Y - 20,
          vx: 0,
          vy: 0,
          gameId: res.gameId,
          lastRow: -1,
          betAmount: betAmount
        });
        
      } else {
        setError(res.message);
        setVisualBalance(prev => prev + betAmount);
        setActiveBallCount(prev => Math.max(0, prev - 1));
      }
    } catch(err) {
      setError("Failed to drop ball");
      setVisualBalance(prev => prev + betAmount);
      setActiveBallCount(prev => Math.max(0, prev - 1));
    }
  };

  // Keyboard support (Space to drop)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        dropBall();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [betAmount, rows, risk, userData]);

  return (
    <div className="min-h-screen p-4 flex flex-col items-center bg-[#0f1923]">
      <div className="w-full max-w-7xl mb-8">
        {/* Hero Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-primary/30 pb-6 gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="relative">
              <img
                src={logo}
                alt="SattaCell Logo"
                className="h-16 w-16 md:h-24 md:w-24 object-contain"
                style={{ filter: 'brightness(0) saturate(100%) invert(78%) sepia(85%) saturate(1000%) hue-rotate(150deg) brightness(101%) contrast(101%)' }}
              />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-display font-bold text-primary tracking-wider">
                SATTACELL
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-neon-red text-xs font-mono">[01]</span>
                <p className="text-muted-foreground font-mono text-xs md:text-sm">
                  // PREDICTION_MARKETS
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            {userData && (
              <>
                <div className="text-xs md:text-sm font-mono border border-primary/30 px-3 py-1.5 md:px-4 md:py-2 bg-card/50">
                  <div className="text-primary truncate max-w-[120px] md:max-w-none">{userData?.email}</div>
                  <div className="text-neon-green text-xs">
                    ¥ {userData?.balance?.toFixed(2)} <span className="text-muted-foreground">TOKENS</span>
                  </div>
                </div>
                <Link to="/dashboard">
                  <Button variant="neon" size="sm" className="md:size-default">Dashboard</Button>
                </Link>
               
              </>
            )}
            <Link to="/admin">
              <Button variant="neon-red" size="sm" className="md:size-default">Admin</Button>
            </Link>
            <LoginButton />
          </div>
        </div>

      {/* Data strip - Japanese aesthetic - Hidden on mobile */}
      <div className="hidden md:flex justify-between items-center text-xs font-mono text-muted-foreground border-y border-primary/20 py-2 mt-2">
        <div className="flex items-center gap-4">
          <span className="text-primary">予測市場</span>
          <span>PN: 2483-AX9</span>
          <span className="text-primary/50">|</span>
          <Link
            to="/"
            className="cursor-pointer hover:text-primary transition-colors"
          >
            ACTIVE PROTOCOL
          </Link>
          <span className="text-primary/50">|</span>
          
<Link
            to="/"
            className="cursor-pointer hover:text-primary transition-colors"
          >
            TEAMS
          </Link>

          <span className="text-primary/50">|</span>
          <span className="text-primary font-bold">
            CASINO
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>BATCH: {new Date().toISOString().split('T')[0]}</span>
          <span className="text-primary/50">|</span>
          <span className="text-neon-red">全頼</span>
        </div>
      </div>
      </div>

      <div className="w-full max-w-7xl mb-4">
        <Link to="/casino" className="text-muted-foreground hover:text-white flex items-center gap-2 transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Casino
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-7xl">
        
        {/* Left Control Panel */}
        <div className="w-full lg:w-80 bg-[#1a2c38] p-6 rounded-lg h-fit border border-white/5 space-y-6">
            
            {/* Bet Input */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400 font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Bet Amount
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  value={betAmount} 
                  onChange={(e) => setBetAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-[#0f1923] border border-white/10 rounded px-4 py-3 text-white font-bold focus:outline-none focus:border-pink-500 transition-colors"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <button onClick={() => setBetAmount(Math.max(0, betAmount / 2))} className="px-2 py-1 text-xs bg-[#2a3c48] hover:bg-[#3a4c58] rounded text-gray-300">½</button>
                  <button onClick={() => setBetAmount(betAmount * 2)} className="px-2 py-1 text-xs bg-[#2a3c48] hover:bg-[#3a4c58] rounded text-gray-300">2×</button>
                </div>
              </div>
            </div>

            {/* Risk Selection */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400 font-medium flex items-center gap-2">
                <Zap className="w-4 h-4" /> Risk Level
              </label>
              <div className="grid grid-cols-3 gap-2 bg-[#0f1923] p-1 rounded-lg">
                {['low', 'medium', 'high'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRisk(r)}
                    className={`py-2 text-sm font-semibold rounded capitalize transition-all ${
                      risk === r 
                        ? 'bg-[#2a3c48] text-white shadow-lg' 
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Rows Selection */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400 font-medium flex items-center gap-2">
                <Settings className="w-4 h-4" /> Rows
              </label>
              <select 
                value={rows} 
                onChange={(e) => setRows(Number(e.target.value))}
                className="w-full bg-[#0f1923] border border-white/10 rounded px-4 py-3 text-white focus:outline-none focus:border-pink-500 cursor-pointer"
              >
                <option value={8}>8 Rows</option>
                <option value={12}>12 Rows</option>
                <option value={16}>16 Rows</option>
              </select>
            </div>
            
             <button 
              onClick={dropBall}
              disabled={!userData || userData.balance < betAmount}
              className="w-full py-4 mt-4 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-lg shadow-lg shadow-pink-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              Bet (Space)
            </button>
            
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm text-center">
                {error}
              </div>
            )}
            
            {/* Last Win Display */}
            {lastWin && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center animate-pulse">
                <div className="text-xs text-emerald-400 mb-1">Last Win</div>
                <div className="text-2xl font-black text-emerald-400">
                  {lastWin.multiplier}x
                </div>
                <div className="text-xs text-white/50">
                  +${lastWin.payout.toFixed(2)}
                </div>
              </div>
            )}
            
            {/* Balance Display */}
            {userData && (
               <div className="text-sm text-gray-400 text-center pt-4 border-t border-white/5">
                 Balance: <span className="text-white font-mono">${visualBalance.toFixed(2)}</span>
               </div>
            )}
        </div>

        {/* Right Game Board (Canvas) */}
        <div className="flex-1 bg-[#1a2c38] rounded-lg border border-white/5 p-4 flex justify-center items-center min-h-[600px]">
          <canvas 
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-auto max-w-[800px]"
          />
        </div>

      </div>
    </div>
  );
};