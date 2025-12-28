import { useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import logo from "/CodeCell Logo White.png";
import { LoginButton } from "@/components/auth/LoginButton";

// Remove API_URL

export const CoinFlip = () => {
  const { userData, refetchUserData } = useAuth();
  const [betAmount, setBetAmount] = useState(10);
  const [choice, setChoice] = useState('heads');
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState(null); // 'heads' or 'tails'
  const [win, setWin] = useState(null);
  const [error, setError] = useState('');

  const flipCoin = async () => {
    if (flipping) return;
    try {
      setFlipping(true);
      setError('');
      setResult(null);
      setWin(null);

      // Animation delay
      await new Promise(r => setTimeout(r, 600));

      const data = await api.post('/casino/coinflip/flip', {
          firebaseUID: userData?.firebaseUID, 
          betAmount, 
          choice 
      });
      
      // Artificial delay for animation to finish
      setTimeout(() => {
        setFlipping(false);
        if (data.success) {
            setResult(data.result);
            setWin(data.win);
            refetchUserData();
            if (data.win) {
                confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
            }
        } else {
            setError(data.message);
        }
      }, 1000);

    } catch (err) {
      setFlipping(false);
      setError('Failed to flip');
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

        <div className="w-full max-w-lg">
            <div className="mb-8">
              <Link to="/casino" className="text-muted-foreground hover:text-white flex items-center gap-2 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Casino
              </Link>
            </div>

            <h1 className="text-3xl font-bold mb-8 text-center flex items-center justify-center gap-3">
                <Coins className="text-yellow-400" /> Coin Flip
            </h1>

            <div className="bg-card/30 backdrop-blur-xl border border-white/10 p-8 rounded-3xl text-center">
                
                <div className="h-48 flex items-center justify-center mb-8 perspective-1000">
                    <motion.div
                        className={`w-36 h-36 rounded-full relative transform-style-3d cursor-pointer ${
                            result === 'heads' ? 'bg-yellow-400' : (result === 'tails' ? 'bg-zinc-300' : 'bg-yellow-400')
                        } shadow-[0_0_50px_rgba(250,204,21,0.3)] flex items-center justify-center border-4 border-white/20`}
                        animate={{ 
                            rotateY: flipping ? 1800 : 0,
                            scale: flipping ? 1.2 : 1
                        }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                    >
                         {/* Simple visual representation */}
                         <span className="text-4xl font-black text-black/50">
                             {!flipping && result ? (result === 'heads' ? 'H' : 'T') : '?'}
                         </span>
                    </motion.div>
                </div>

                {win !== null && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-6 text-2xl font-bold ${win ? 'text-green-400' : 'text-red-400'}`}
                    >
                        {win ? `YOU WON ${(betAmount * 1.98).toFixed(2)}!` : 'YOU LOST'}
                    </motion.div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <button 
                        onClick={() => setChoice('heads')}
                        className={`p-4 rounded-xl border transition-all ${choice === 'heads' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'bg-black/20 border-white/10 hover:bg-white/5'}`}
                    >
                        HEADS
                    </button>
                    <button 
                         onClick={() => setChoice('tails')}
                         className={`p-4 rounded-xl border transition-all ${choice === 'tails' ? 'bg-zinc-400/20 border-zinc-400 text-zinc-300' : 'bg-black/20 border-white/10 hover:bg-white/5'}`}
                    >
                        TAILS
                    </button>
                </div>

                <div className="mb-6">
                     <label className="text-sm text-muted-foreground mb-2 block text-left">Bet Amount</label>
                     <input 
                        type="number" 
                        value={betAmount} 
                        onChange={(e) => setBetAmount(Number(e.target.value))}
                        disabled={flipping}
                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 font-mono focus:outline-none focus:border-yellow-500/50 transition-colors"
                     />
                </div>

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                <button 
                    onClick={flipCoin}
                    disabled={flipping || userData?.balance < betAmount}
                    className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-yellow-500/20 disabled:opacity-50"
                >
                    {flipping ? 'FLIPPING...' : 'FLIP COIN'}
                </button>
            </div>
        </div>
    </div>
  );
};
