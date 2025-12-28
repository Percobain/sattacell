// components/games/Mines.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bomb, Gem, Coins, Gamepad2, Box, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import logo from "/CodeCell Logo White.png";
import { LoginButton } from "@/components/auth/LoginButton";

export const Mines = () => {
  const { userData, refetchUserData } = useAuth();
  const [betAmount, setBetAmount] = useState(10);
  const [minesCount, setMinesCount] = useState(3);
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gameId, setGameId] = useState(null);

  const startGame = async () => {
    try {
      setLoading(true);
      setError('');
      setGameState(null);
      setGameId(null);
      
      const data = await api.post('/casino/mines/start', {
        firebaseUID: userData?.firebaseUID,
        betAmount, 
        minesCount 
      });

      if (data.success) {
        setGameId(data.gameId);
        setGameState({
          minesCount: data.state.minesCount,
          revealedTiles: data.state.revealedTiles || [],
          gameOver: false,
          multiplier: 1.0,
          mineLocations: null // Hidden until game over
        });
        refetchUserData();
      } else {
        setError(data.message || 'Failed to start game');
      }
    } catch (err) {
      setError(err.message || 'Failed to start game');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clickTile = async (index) => {
    if (loading || !gameId || gameState?.gameOver || gameState?.revealedTiles?.includes(index)) {
      return;
    }
    
    try {
      setLoading(true);
      const data = await api.post('/casino/mines/click', { 
        gameId, 
        tileIndex: index 
      });
      
      if (data.success) {
        if (data.gameOver) {
          // Hit a mine - game lost
          setGameState(prev => ({ 
            ...prev, 
            gameOver: true,
            revealedTiles: [...(prev.revealedTiles || []), index],
            mineLocations: data.mineLocations // Reveal all mines
          }));
          refetchUserData();
        } else {
          // Safe tile - continue game
          setGameState(prev => ({
            ...prev,
            revealedTiles: data.revealedTiles || [...(prev.revealedTiles || []), index],
            multiplier: data.multiplier || prev.multiplier
          }));
        }
      } else {
        setError(data.message || 'Click failed');
      }
    } catch (err) {
      setError(err.message || 'Click failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cashout = async () => {
    if(!gameId || !gameState || gameState.gameOver) return;
    
    try {
      setLoading(true);
      const data = await api.post('/casino/mines/cashout', { gameId });
      
      if (data.success) {
        setGameState(prev => ({ 
          ...prev, 
          gameOver: true, 
          mineLocations: data.mineLocations 
        }));
        refetchUserData();
        
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        setError(data.message || 'Cashout failed');
      }
    } catch (err) {
      setError(err.message || 'Cashout failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isRevealed = (i) => gameState?.revealedTiles?.includes(i);
  const isMine = (i) => gameState?.mineLocations?.includes(i);

  const getTileContent = (i) => {
    // Show mine if game is over and tile is a mine
    if (gameState?.gameOver && isMine(i)) {
      return <Bomb className="w-6 h-6 md:w-8 md:h-8 text-red-500 animate-pulse" />;
    }
    // Show gem if revealed and safe
    if (isRevealed(i)) {
      return <Gem className="w-6 h-6 md:w-8 md:h-8 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]" />;
    }
    return null;
  };

  const currentPayout = betAmount * (gameState?.multiplier || 1);

  return (
    <div className="min-h-screen p-4 flex flex-col items-center">
      <div className="w-full max-w-6xl mb-8">
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

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl"
      >
        <div className="mb-8">
          <Link to="/casino" className="text-muted-foreground hover:text-white flex items-center gap-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Casino
          </Link>
        </div>
        
        <div className="grid md:grid-cols-[320px_1fr] gap-8">
        {/* Controls Panel */}
        <div className="bg-card/30 backdrop-blur-xl border border-white/10 p-6 rounded-2xl h-fit space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500">
              <Box className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">Mines</h2>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Bet Amount */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Bet Amount
            </label>
            <div className="relative">
              <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="number" 
                value={betAmount} 
                onChange={(e) => setBetAmount(Number(e.target.value))}
                disabled={gameState && !gameState.gameOver}
                min="1"
                max={userData?.balance || 1000}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 font-mono focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          {/* Mines Count */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Mines ({minesCount})
            </label>
            <input 
              type="range" 
              min="1" 
              max="24" 
              value={minesCount} 
              onChange={(e) => setMinesCount(Number(e.target.value))}
              disabled={gameState && !gameState.gameOver}
              className="w-full accent-primary disabled:opacity-50"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1</span>
              <span>24</span>
            </div>
          </div>

          {/* Game Actions */}
          {!gameState || gameState.gameOver ? (
            <button 
              onClick={startGame}
              disabled={loading || !userData || userData.balance < betAmount || betAmount <= 0}
              className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Starting...' : 'Start Game'}
            </button>
          ) : (
            <div className="space-y-4">
              {/* Multiplier Display */}
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                <div className="text-sm text-emerald-400 mb-1">Current Multiplier</div>
                <div className="text-3xl font-black text-emerald-400">
                  {gameState?.multiplier?.toFixed(2) || '1.00'}x
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Potential Win: <span className="text-white font-bold">${currentPayout.toFixed(2)}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Gems: {gameState?.revealedTiles?.length || 0}
                </div>
              </div>
              
              {/* Cashout Button */}
              <button 
                onClick={cashout}
                disabled={loading || !gameState?.revealedTiles?.length}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Cashing Out...' : `Cashout $${currentPayout.toFixed(2)}`}
              </button>
            </div>
          )}

          {/* Balance Display */}
          {userData && (
            <div className="text-sm text-muted-foreground text-center pt-4 border-t border-white/5">
              Balance: ${userData.balance?.toFixed(2)}
            </div>
          )}
        </div>

        {/* Game Grid */}
        <div className="bg-card/20 backdrop-blur-sm border border-white/5 rounded-3xl p-4 md:p-8 flex items-center justify-center relative overflow-hidden min-h-[500px]">
          <div className="grid grid-cols-5 gap-2 md:gap-4 w-full max-w-[600px] aspect-square">
            {Array.from({ length: 25 }).map((_, i) => (
              <motion.button
                key={i}
                whileHover={!isRevealed(i) && gameState && !gameState.gameOver ? { scale: 1.05 } : {}}
                whileTap={!isRevealed(i) && gameState && !gameState.gameOver ? { scale: 0.95 } : {}}
                onClick={() => clickTile(i)}
                disabled={
                  loading ||
                  isRevealed(i) || 
                  !gameState || 
                  gameState.gameOver
                }
                className={`
                  relative rounded-xl border-b-4 transition-all duration-200 flex items-center justify-center aspect-square
                  ${isRevealed(i) 
                    ? 'bg-black/40 border-black/20 translate-y-1' 
                    : 'bg-primary/20 border-primary/40 hover:bg-primary/30 active:border-b-0 active:translate-y-1'
                  }
                  ${gameState?.gameOver && isMine(i) ? 'bg-red-500/20 border-red-500/40' : ''}
                  ${!gameState || gameState.gameOver ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                  disabled:cursor-not-allowed
                `}
              >
                <AnimatePresence>
                  {(isRevealed(i) || (gameState?.gameOver && isMine(i))) && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    >
                      {getTileContent(i)}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>
          
          {/* No Game Overlay */}
          {!gameState && !loading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-3xl">
              <div className="text-center">
                <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-primary opacity-50" />
                <p className="text-lg text-muted-foreground font-medium">
                  Place a bet to start playing
                </p>
              </div>
            </div>
          )}
        </div>
        </div>
      </motion.div>
    </div>
  );
};