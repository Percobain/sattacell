import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dices, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { RefreshCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import logo from "/CodeCell Logo White.png";
import { LoginButton } from "@/components/auth/LoginButton";

// Remove API_URL

export const Dice = () => {
    const { userData, refetchUserData } = useAuth();
    const [betAmount, setBetAmount] = useState(10);
    const [targetNumber, setTargetNumber] = useState(50);
    const [condition, setCondition] = useState('over'); // 'over' | 'under'
    const [rolling, setRolling] = useState(false);
    const [lastRoll, setLastRoll] = useState(null);
    const [win, setWin] = useState(null);
    const [payout, setPayout] = useState(0);
    const [winMultiplier, setWinMultiplier] = useState(0);
    const [error, setError] = useState('');

    const multiplier = condition === 'over' 
        ? (99 / (100 - targetNumber)).toFixed(4)
        : (99 / targetNumber).toFixed(4);
    
    const winChance = condition === 'over'
        ? (100 - targetNumber).toFixed(2)
        : targetNumber.toFixed(2);

    const rollDice = async () => {
        try {
            setRolling(true);
            setWin(null);
            setError('');
            setPayout(0);
            setWinMultiplier(0);
            
            // Animation
            let i = 0;
            const interval = setInterval(() => {
                setLastRoll((Math.random() * 100).toFixed(2));
                i++;
                if (i > 10) clearInterval(interval);
            }, 50);

            const data = await api.post('/casino/dice/roll', { 
                firebaseUID: userData?.firebaseUID, 
                betAmount, 
                targetNumber, 
                condition 
            });
            
            clearInterval(interval);
            setRolling(false);
            
            if(data.success) {
                setLastRoll(data.roll);
                setWin(data.win);
                setPayout(data.payout);
                setWinMultiplier(data.multiplier);
                refetchUserData();
                if(data.win) {
                    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
                }
            } else {
                setError(data.message);
            }
        } catch (err) {
            setRolling(false);
            setError('Roll failed');
        }
    }

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

             <div className="w-full max-w-3xl">
                 <div className="mb-8">
                   <Link to="/casino" className="text-muted-foreground hover:text-white flex items-center gap-2 transition-colors">
                     <ArrowLeft className="w-4 h-4" /> Back to Casino
                   </Link>
                 </div>
                 <div className="bg-card/30 backdrop-blur-xl border border-white/10 p-8 rounded-3xl">
                     
                     <div className="flex justify-between items-center mb-12">
                         <div className="text-center w-full">
                             <div className="text-6xl font-black font-mono tracking-tighter mb-2 transition-all"
                                  style={{ color: win === true ? '#4ade80' : (win === false ? '#ef4444' : 'white') }}
                             >
                                 {lastRoll || "00.00"}
                             </div>
                             {lastRoll && (
                                <div className={`text-lg font-bold ${win ? 'text-green-500' : 'text-red-500'}`}>
                                    {win ? 'WIN' : 'LOSS'}
                                </div>
                             )}
                         </div>
                     </div>

                     <div className="bg-black/40 rounded-xl p-6 mb-8 relative">
                         {/* Slider Visualization */}
                        <div className="relative h-12 bg-white/5 rounded-full overflow-hidden mb-4 flex items-center px-2">
                             {/* Win Area - Dynamic coloring based on condition */}
                             <div 
                                className={`absolute inset-y-0 ${condition === 'over' ? 'right-0 bg-green-500/20' : 'left-0 bg-green-500/20'}`}
                                style={{ width: `${winChance}%` }}
                             />
                             {/* Slider Input */}
                             <input 
                                type="range" 
                                min="2" 
                                max="98" 
                                step="1"
                                value={targetNumber}
                                onChange={(e) => setTargetNumber(Number(e.target.value))}
                                className="w-full z-10 accent-primary cursor-pointer"
                             />
                        </div>
                        <div className="flex justify-between text-sm font-mono text-muted-foreground">
                            <span>0</span>
                            <span>25</span>
                            <span>50</span>
                            <span>75</span>
                            <span>100</span>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                         <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                             <div className="text-xs text-muted-foreground mb-1">Multiplier</div>
                             <div className="text-xl font-bold">{multiplier}x</div>
                         </div>
                         <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                             <div className="text-xs text-muted-foreground mb-1">Win Chance</div>
                             <div className="text-xl font-bold">{winChance}%</div>
                         </div>
                         <button 
                            onClick={() => setCondition(c => c === 'over' ? 'under' : 'over')}
                            className="bg-black/20 p-4 rounded-xl border border-white/5 hover:bg-white/5 transition-colors"
                         >
                             <div className="text-xs text-muted-foreground mb-1">Roll Decision</div>
                             <div className="text-xl font-bold flex items-center justify-between">
                                 {condition === 'over' ? 'Roll Over' : 'Roll Under'}
                                 <RefreshCcw className="w-4 h-4 ml-2" />
                             </div>
                         </button>
                     </div>

                     <div className="flex gap-4">
                        <div className="flex-1">
                             <input 
                                type="number" 
                                value={betAmount} 
                                onChange={(e) => setBetAmount(Number(e.target.value))}
                                className="w-full h-full bg-black/20 border border-white/10 rounded-xl px-4 font-mono text-lg focus:outline-none focus:border-primary/50"
                                placeholder="Bet Amount"
                             />
                        </div>
                        <button 
                            onClick={rollDice}
                            disabled={rolling || userData?.balance < betAmount}
                            className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                        >
                            ROLL DICE
                        </button>
                     </div>

                    {/* Result Display */}
                    {win !== null && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`mt-6 p-4 rounded-xl border ${win ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'} text-center`}
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className={`text-xs ${win ? 'text-green-400' : 'text-red-400'} mb-1`}>Multiplier Won</div>
                                    <div className={`text-2xl font-black ${win ? 'text-green-400' : 'text-red-400'}`}>
                                        {win ? `${winMultiplier}x` : '0.00x'}
                                    </div>
                                </div>
                                <div>
                                    <div className={`text-xs ${win ? 'text-green-400' : 'text-red-400'} mb-1`}>Tokens Won</div>
                                    <div className={`text-2xl font-black ${win ? 'text-green-400' : 'text-red-400'}`}>
                                        {win ? `+${payout}` : `-${betAmount}`}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                     {/* Balance Display */}
                     {userData && (
                        <div className="text-sm text-center pt-8 mt-4 border-t border-white/5">
                            <span className="text-muted-foreground mr-2">Balance:</span>
                            <span className="font-mono text-white text-lg">${userData.balance?.toFixed(2)}</span>
                        </div>
                     )}
                 </div>
             </div>
        </div>
    );
};
