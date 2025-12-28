import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Disc, Trash2, RotateCcw, RefreshCw, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import logo from "/CodeCell Logo White.png";
import { LoginButton } from "@/components/auth/LoginButton";

// European Roulette Sequence
const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

export const Roulette = () => {
  const { userData, refetchUserData } = useAuth();
  const [bets, setBets] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [resultNumber, setResultNumber] = useState(null);
  const [totalPayout, setTotalPayout] = useState(0);
  const [error, setError] = useState('');
  const [defaultBetAmount, setDefaultBetAmount] = useState(10);
  
  const wheelControls = useAnimation();
  const ballControls = useAnimation();

  const getNumberColor = (num) => {
    if(num === 0) return 'green';
    return RED_NUMBERS.includes(num) ? 'red' : 'black';
  };

  const addBet = (type, value, amount = defaultBetAmount) => {
    if(spinning) return;
    if(amount <= 0) return;
    setBets(prev => [...prev, { type, value, amount: Number(amount) }]);
  };

  const clearBets = () => {
    if(spinning) return;
    setBets([]);
  };

  const removeBet = (index) => {
    if(spinning) return;
    setBets(prev => prev.filter((_, i) => i !== index));
  };

  const spin = async () => {
    if(bets.length === 0 || spinning) return;
    
    const totalBet = bets.reduce((sum, b) => sum + b.amount, 0);
    if(!userData || userData.balance < totalBet) {
      setError('Insufficient balance');
      return;
    }
    
    try {
      setSpinning(true);
      setError('');
      setResultNumber(null);
      setTotalPayout(0);
      
      const data = await api.post('/casino/roulette', {
        firebaseUID: userData?.firebaseUID, 
        bets
      });
      
      if(data.success) {
        // Calculate rotations
        const targetNumber = data.resultNumber;
        const targetIndex = WHEEL_NUMBERS.indexOf(targetNumber);
        const singleRotationAngle = 360 / 37;
        
        // We want the target number to be at the TOP (0 degrees)
        // The ball lands at the top (Needle position)
        // Initial angular position of center of target cell = (index * angle) + (angle/2)
        // To bring that to 0, we need to rotate BACK by that amount.
        // We spin forward (positive), so we go to (Base360 - TargetPos)
        
        const extraSpins = 5;
        const baseRotation = 360 * extraSpins;
        
        // Add random jitter within the cell ( +/- 40% of cell width)
        const jitter = (Math.random() - 0.5) * (singleRotationAngle * 0.8);
        
        const targetRotation = baseRotation - (targetIndex * singleRotationAngle) - (singleRotationAngle / 2) + jitter;

        // Spin wheel
        await Promise.all([
          wheelControls.start({
            rotate: targetRotation,
            transition: { duration: 5, ease: [0.2, 0.8, 0.2, 1] }
          }),
          // Animate ball spinning opposite direction and landing
           ballControls.start({
            rotate: -360 * (extraSpins + 1), // Spin ball opposite
            transition: { duration: 5, ease: [0.2, 0.8, 0.2, 1] }
          })
        ]);

        setResultNumber(data.resultNumber);
        setTotalPayout(data.totalPayout);
        refetchUserData();
        
        if(data.totalPayout > 0) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
        
        setTimeout(() => {
          setBets([]);
          // Reset rotations quietly for next spin if needed or keep them
          // For now we keep them to show the result
        }, 3000);
      } else {
        setError(data.message || 'Spin failed');
      }
      setSpinning(false);

    } catch(err) {
      setSpinning(false);
      setError(err.message || 'Spin failed');
      console.error(err);
    }
  };

  const totalBet = bets.reduce((sum, b) => sum + b.amount, 0);

  const getBetCountForNumber = (num) => {
    return bets.filter(b => b.type === 'number' && b.value === num).length;
  };

  const getBetLabel = (bet) => {
    switch(bet.type) {
      case 'number': return `#${bet.value}`;
      case 'dozen': return `${bet.value === 1 ? '1st' : bet.value === 2 ? '2nd' : '3rd'} 12`;
      case 'column': return `${bet.value === 1 ? '1st' : bet.value === 2 ? '2nd' : '3rd'} Col`;
      default: return String(bet.value).toUpperCase();
    }
  };

  return (
    <div className="min-h-screen p-4 flex flex-col items-center">
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

      <div className="w-full max-w-6xl">
        <div className="mb-8">
          <Link to="/casino" className="text-muted-foreground hover:text-white flex items-center gap-2 transition-colors w-fit">
            <ArrowLeft className="w-4 h-4" /> Back to Casino
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8 text-center flex items-center justify-center gap-3">
          <Disc className="text-red-500" /> Roulette
        </h1>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg text-center">
            {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Wheel Area */}
          <div className="flex-1 flex flex-col items-center justify-center relative p-8">
            {/* Outer Rim */}
            <div className="relative w-[320px] h-[320px] md:w-[450px] md:h-[450px] rounded-full bg-[#2c1a0e] border-8 border-[#d4af37] shadow-2xl flex items-center justify-center p-2">
              <div className="absolute inset-0 rounded-full border border-white/10 pointer-events-none z-10"></div>
              
              {/* Spinning Wheel Container */}
              <motion.div 
                className="w-full h-full relative"
                animate={wheelControls}
                initial={{ rotate: 0 }}
              >
                {/* SVG Wheel */}
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {WHEEL_NUMBERS.map((num, i) => {
                    const angle = 360 / 37;
                    const rotation = i * angle;
                    const color = num === 0 ? '#00b300' : RED_NUMBERS.includes(num) ? '#cc0000' : '#000000';
                    
                    // Path for the segment
                    // Creating a pie slice
                    // Using a slightly smaller radius for the fill to leave room for the stroke? 
                    // No, stroke is centered.
                    
                    // Calculate text position radially
                    // Center of wedge is angle/2
                    const midAngle = angle / 2;
                    const rText = 40; // Push text out to 80% of radius (radius is 50, border is 48?)
                    const rad = (Math.PI * midAngle) / 180;
                    const tx = 50 + rText * Math.cos(rad);
                    const ty = 50 + rText * Math.sin(rad);

                    return (
                      <g key={num} transform={`rotate(${rotation} 50 50)`}>
                        <path 
                          d={`M50 50 L${50 + 48} 50 A48 48 0 0 1 ${50 + 48 * Math.cos((Math.PI * angle) / 180)} ${50 + 48 * Math.sin((Math.PI * angle) / 180)} Z`}
                          fill={color}
                          stroke="#d4af37"
                          strokeWidth="0.5"
                        />
                        {/* Number Text */}
                        <text
                          x={tx}
                          y={ty}
                          fill="white"
                          fontSize="3.8"
                          fontWeight="900"
                          textAnchor="middle"
                          transform={`rotate(${midAngle + 90} ${tx} ${ty})`}
                          alignmentBaseline="middle"
                        >
                          {num}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Inner Decoration */}
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-[60%] h-[60%] rounded-full bg-[#4a0e0e] border-4 border-[#d4af37] shadow-inner flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-[#d4af37] shadow-2xl relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#f9d77e] rounded-full blur-sm"></div>
                        <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-8 h-2 bg-[#d4af37] rounded-full"></div>
                         <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-8 h-2 bg-[#d4af37] rounded-full"></div>
                      </div>
                   </div>
                </div>

              </motion.div>

              {/* Ball Animation Container */}
               {/* Fixed overlay for the ball track - or animate ball separately? 
                   We animated ballControls to rotate opposite. 
                   We need a ball element that sits at the top (idx 0 position) relative to a container, 
                   and the container spins.
               */}
               <motion.div 
                 className="absolute inset-0 pointer-events-none"
                 animate={ballControls}
               >
                 <div className="absolute top-[12%] left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] z-20"></div>
               </motion.div>
               
               {/* Needle / Marker at Top */}
               <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-8 bg-[#d4af37] z-30 clip-path-triangle shadow-lg"></div>

            </div>
            
            {/* Result Message */}
            {resultNumber !== null && !spinning && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
              >
                <div className="bg-black/90 px-8 py-4 rounded-xl border-2 border-[#d4af37] backdrop-blur-xl">
                  <div className={`text-4xl font-black mb-1 ${
                    totalPayout > 0 ? 'text-[#d4af37]' : 'text-white'
                  }`}>
                    {totalPayout > 0 ? `WON $${totalPayout.toFixed(2)}` : 'TRY AGAIN'}
                  </div>
                  <div className="text-center text-zinc-400 font-mono text-xl">
                     {resultNumber} <span className="text-[#d4af37]">|</span> {getNumberColor(resultNumber).toUpperCase()}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Betting Table */}
          <div className="flex-[2] bg-emerald-900/40 p-4 rounded-xl border border-emerald-500/20 backdrop-blur-md">
            {/* Default Bet Amount */}
            <div className="mb-4">
              <label className="text-xs text-muted-foreground mb-1 block">
                Bet Amount (per chip)
              </label>
              <input 
                type="number"
                value={defaultBetAmount}
                onChange={(e) => setDefaultBetAmount(Number(e.target.value))}
                disabled={spinning}
                min="1"
                className="w-32 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono disabled:opacity-50"
              />
            </div>

            {/* Number Grid Container */}
            <div className="relative mb-6 select-none">
               <div className="flex">
                  {/* Zero Column */}
                  <div 
                    onClick={() => addBet('number', 0)}
                    className="w-12 mr-1 bg-green-600 hover:bg-green-500 rounded-l flex items-center justify-center cursor-pointer font-bold border border-white/5 relative transition-all hover:brightness-110"
                    style={{ height: '150px' }} // Height of 3 rows (3 * 48px + gaps)
                  >
                    <span className="-rotate-90">0</span>
                    {getBetCountForNumber(0) > 0 && (
                      <div className="absolute top-1 right-1 bg-yellow-400 text-black text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold shadow-sm">
                         {getBetCountForNumber(0)}
                      </div>
                    )}
                  </div>

                  {/* Numbers Grid */}
                  <div className="flex-1">
                     <div className="grid grid-cols-12 gap-1 mb-1">
                        {/* Row 3 (3, 6, 9... 36) */}
                        {[...Array(12)].map((_, i) => {
                          const num = (i + 1) * 3;
                          return (
                            <div 
                              key={num} 
                              onClick={() => addBet('number', num)}
                              className={`
                                h-12 flex items-center justify-center font-bold cursor-pointer 
                                border border-white/5 relative transition-all hover:brightness-125
                                ${RED_NUMBERS.includes(num) ? 'bg-red-600' : 'bg-zinc-800'}
                              `}
                            >
                              {num}
                              {getBetCountForNumber(num) > 0 && (
                                <div className="absolute top-0.5 right-0.5 bg-yellow-400 text-black text-[10px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold shadow-sm">
                                  {getBetCountForNumber(num)}
                                </div>
                              )}
                            </div>
                          );
                        })}
                     </div>
                     <div className="grid grid-cols-12 gap-1 mb-1">
                        {/* Row 2 (2, 5, 8... 35) */}
                        {[...Array(12)].map((_, i) => {
                           const num = (i + 1) * 3 - 1;
                           return (
                             <div 
                               key={num} 
                               onClick={() => addBet('number', num)}
                               className={`
                                 h-12 flex items-center justify-center font-bold cursor-pointer 
                                 border border-white/5 relative transition-all hover:brightness-125
                                 ${RED_NUMBERS.includes(num) ? 'bg-red-600' : 'bg-zinc-800'}
                               `}
                             >
                               {num}
                               {getBetCountForNumber(num) > 0 && (
                                 <div className="absolute top-0.5 right-0.5 bg-yellow-400 text-black text-[10px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold shadow-sm">
                                   {getBetCountForNumber(num)}
                                 </div>
                               )}
                             </div>
                           );
                         })}
                     </div>
                     <div className="grid grid-cols-12 gap-1">
                        {/* Row 1 (1, 4, 7... 34) */}
                        {[...Array(12)].map((_, i) => {
                           const num = (i + 1) * 3 - 2;
                           return (
                             <div 
                               key={num} 
                               onClick={() => addBet('number', num)}
                               className={`
                                 h-12 flex items-center justify-center font-bold cursor-pointer 
                                 border border-white/5 relative transition-all hover:brightness-125
                                 ${RED_NUMBERS.includes(num) ? 'bg-red-600' : 'bg-zinc-800'}
                               `}
                             >
                               {num}
                               {getBetCountForNumber(num) > 0 && (
                                 <div className="absolute top-0.5 right-0.5 bg-yellow-400 text-black text-[10px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold shadow-sm">
                                   {getBetCountForNumber(num)}
                                 </div>
                               )}
                             </div>
                           );
                         })}
                     </div>
                  </div>

                  {/* 2 to 1 Columns Bet */}
                  <div className="w-12 ml-1 flex flex-col gap-1">
                     <div onClick={() => addBet('column', 1)} className="h-12 bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-xs font-bold border border-white/5 cursor-pointer transition-all">2:1</div>
                     <div onClick={() => addBet('column', 2)} className="h-12 bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-xs font-bold border border-white/5 cursor-pointer transition-all">2:1</div>
                     <div onClick={() => addBet('column', 3)} className="h-12 bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-xs font-bold border border-white/5 cursor-pointer transition-all">2:1</div>
                  </div>
               </div>

               {/* Dozens */}
               <div className="grid grid-cols-3 gap-1 mt-1 pl-12 pr-12">
                   <div onClick={() => addBet('dozen', 1)} className="h-10 bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-sm font-bold border border-white/5 cursor-pointer transition-all">1 to 12</div>
                   <div onClick={() => addBet('dozen', 2)} className="h-10 bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-sm font-bold border border-white/5 cursor-pointer transition-all">13 to 24</div>
                   <div onClick={() => addBet('dozen', 3)} className="h-10 bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-sm font-bold border border-white/5 cursor-pointer transition-all">25 to 36</div>
               </div>
               
               {/* 1:1 Bets */}
               <div className="grid grid-cols-6 gap-1 mt-1 pl-12 pr-12">
                   <div onClick={() => addBet('low', '1-18')} className="h-10 bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-sm font-bold border border-white/5 cursor-pointer transition-all">1 to 18</div>
                   <div onClick={() => addBet('parity', 'even')} className="h-10 bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-sm font-bold border border-white/5 cursor-pointer transition-all">EVEN</div>
                   <div onClick={() => addBet('color', 'red')} className="h-10 bg-red-600 hover:bg-red-500 flex items-center justify-center text-sm font-bold border border-white/5 cursor-pointer transition-all">RED</div>
                   <div onClick={() => addBet('color', 'black')} className="h-10 bg-black hover:bg-zinc-900 flex items-center justify-center text-sm font-bold border border-white/5 cursor-pointer transition-all">BLACK</div>
                   <div onClick={() => addBet('parity', 'odd')} className="h-10 bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-sm font-bold border border-white/5 cursor-pointer transition-all">ODD</div>
                   <div onClick={() => addBet('high', '19-36')} className="h-10 bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-sm font-bold border border-white/5 cursor-pointer transition-all">19 to 36</div>
               </div>
            </div>
            
            {/* Current Bets List */}
            {bets.length > 0 && (
              <div className="mb-4 p-3 bg-black/40 rounded-lg max-h-32 overflow-y-auto">
                <div className="text-xs text-muted-foreground mb-2">Current Bets:</div>
                <div className="space-y-1">
                  {bets.map((bet, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span>
                        {getBetLabel(bet)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">${bet.amount}</span>
                        <button 
                          onClick={() => removeBet(i)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Control Panel */}
            <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl">
              <div>
                <div className="text-xs text-muted-foreground">Total Bet</div>
                <div className="text-2xl font-bold">${totalBet.toFixed(2)}</div>
                {userData && (
                  <div className="text-xs text-muted-foreground">
                    Balance: ${userData.balance?.toFixed(2)}
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={clearBets} 
                  disabled={spinning || bets.length === 0}
                  className="px-4 py-2 hover:bg-white/10 rounded-lg text-sm text-red-400 transition-all disabled:opacity-50"
                >
                  Clear
                </button>
                <button 
                  onClick={spin}
                  disabled={spinning || totalBet === 0 || !userData || userData.balance < totalBet}
                  className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl shadow-lg shadow-yellow-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {spinning ? 'SPINNING...' : 'SPIN'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};