// components/games/Blackjack.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import logo from "/CodeCell Logo White.png";
import { LoginButton } from "@/components/auth/LoginButton";

const Card = ({ card, hidden }) => (
  <div className={`
    w-20 h-28 md:w-24 md:h-36 rounded-lg border-2 shadow-xl m-1 flex items-center justify-center text-xl font-bold relative
    ${hidden ? 'bg-red-800 border-white/10' : 'bg-white text-black border-white'}
  `}>
    {hidden ? (
      <div className="w-full h-full bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-red-700 to-red-900 rounded-md" />
    ) : (
      <>
        <span className={`absolute top-2 left-2 text-sm ${['H','D'].includes(card.s) ? 'text-red-500' : 'text-black'}`}>
          {card.v}
        </span>
        <span className={`text-4xl ${['H','D'].includes(card.s) ? 'text-red-500' : 'text-black'}`}>
          {card.s === 'H' ? '♥' : card.s === 'D' ? '♦' : card.s === 'C' ? '♣' : '♠'}
        </span>
        <span className={`absolute bottom-2 right-2 rotate-180 text-sm ${['H','D'].includes(card.s) ? 'text-red-500' : 'text-black'}`}>
          {card.v}
        </span>
      </>
    )}
  </div>
);

export const Blackjack = () => {
  const { userData, refetchUserData } = useAuth();
  const [betAmount, setBetAmount] = useState(10);
  const [gameState, setGameState] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const deal = async () => {
    try {
      setLoading(true);
      setError('');
      
      const data = await api.post('/casino/blackjack/init', {
        firebaseUID: userData?.firebaseUID,
        betAmount 
      });

      if(data.success) {
        setGameId(data.gameId);
        setGameState(data);
        refetchUserData();
        
        // Auto-confetti for blackjack
        if(data.outcome === 'blackjack') {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
      } else {
        setError(data.message || 'Failed to start game');
      }
    } catch(err) {
      setError(err.message || 'Failed to start game');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const hit = async () => {
    if(loading) return;
    try {
      setLoading(true);
      const data = await api.post('/casino/blackjack/hit', { gameId });
      
      if(data.success) {
        setGameState(prev => ({ 
          ...prev, 
          playerHand: data.playerHand,
          playerScore: data.playerScore,
          gameOver: data.gameOver,
          outcome: data.outcome,
          canDouble: data.canDouble || false
        }));
        
        if(data.gameOver) {
          refetchUserData();
        }
      } else {
        setError(data.message || 'Hit failed');
      }
    } catch(err) {
      setError(err.message || 'Hit failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stand = async () => {
    if(loading) return;
    try {
      setLoading(true);
      const data = await api.post('/casino/blackjack/stand', { gameId });
      
      if(data.success) {
        setGameState(prev => ({ 
          ...prev, 
          dealerVisible: data.dealerHand,
          dealerScore: data.dealerScore,
          playerScore: data.playerScore,
          gameOver: true,
          outcome: data.outcome,
          payout: data.payout
        }));
        
        refetchUserData();
        
        // Celebrate wins
        if(['win', 'dealer_bust'].includes(data.outcome)) {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        }
      } else {
        setError(data.message || 'Stand failed');
      }
    } catch(err) {
      setError(err.message || 'Stand failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const doubleDown = async () => {
    if(loading) return;
    try {
      setLoading(true);
      const data = await api.post('/casino/blackjack/double', { gameId });
      
      if(data.success) {
        setGameState(prev => ({ 
          ...prev, 
          playerHand: data.playerHand,
          playerScore: data.playerScore,
          dealerVisible: data.dealerHand,
          dealerScore: data.dealerScore,
          gameOver: true,
          outcome: data.outcome,
          payout: data.payout,
          doubled: true
        }));
        
        refetchUserData();
        
        if(['win', 'dealer_bust'].includes(data.outcome)) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
      } else {
        setError(data.message || 'Double down failed');
      }
    } catch(err) {
      setError(err.message || 'Double down failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getOutcomeMessage = (outcome) => {
    const messages = {
      'blackjack': '🎉 BLACKJACK!',
      'win': '🎊 YOU WIN!',
      'dealer_bust': '💥 DEALER BUST!',
      'push': '🤝 PUSH',
      'lose': '😔 YOU LOSE',
      'bust': '💣 BUST!'
    };
    return messages[outcome] || outcome?.toUpperCase();
  };

  const getOutcomeColor = (outcome) => {
    if(['blackjack', 'win', 'dealer_bust'].includes(outcome)) return 'text-green-500';
    if(outcome === 'push') return 'text-yellow-500';
    return 'text-red-500';
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

      <div className="w-full max-w-4xl">
        <div className="mb-8">
          <Link to="/casino" className="text-muted-foreground hover:text-white flex items-center gap-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Casino
          </Link>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-8 text-center flex items-center justify-center gap-3">
          <Gamepad2 className="text-green-500" /> Blackjack
        </h1>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Dealer Area */}
        <div className="mb-12 flex flex-col items-center">
          <div className="text-sm text-muted-foreground mb-2">
            DEALER {gameState?.dealerScore ? `(${gameState.dealerScore})` : ''}
          </div>
          <div className="flex justify-center flex-wrap">
            {gameState ? (
              gameState.gameOver ? (
                gameState.dealerVisible?.map((c, i) => <Card key={i} card={c} />)
              ) : (
                <>
                  {gameState.dealerVisible?.map((c, i) => <Card key={i} card={c} />)}
                  <Card hidden />
                </>
              )
            ) : (
              <div className="h-36 w-24 border-2 border-white/5 rounded-lg border-dashed flex items-center justify-center opacity-20">
                <Gamepad2 />
              </div>
            )}
          </div>
        </div>

        {/* Outcome Message */}
        {gameState?.gameOver && gameState?.outcome && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center my-8"
          >
            <h2 className={`text-4xl font-black ${getOutcomeColor(gameState.outcome)}`}>
              {getOutcomeMessage(gameState.outcome)}
            </h2>
            {gameState.payout > 0 && (
              <p className="text-2xl text-green-400 mt-2">
                +${gameState.payout.toFixed(2)}
              </p>
            )}
          </motion.div>
        )}

        {/* Player Area */}
        <div className="mb-12 flex flex-col items-center">
          <div className="text-sm text-muted-foreground mb-2">
            YOU {gameState?.playerScore ? `(${gameState.playerScore})` : ''}
          </div>
          <div className="flex justify-center flex-wrap">
            {gameState?.playerHand?.map((c, i) => <Card key={i} card={c} />)}
          </div>
        </div>

        {/* Controls */}
        <div className="fixed bottom-0 left-0 w-full p-6 bg-black/80 backdrop-blur-xl border-t border-white/10 flex justify-center gap-4">
          {!gameState || gameState.gameOver ? (
            <div className="flex gap-4 w-full max-w-md">
              <input 
                type="number" 
                value={betAmount} 
                onChange={(e) => setBetAmount(Number(e.target.value))}
                min="1"
                max={userData?.balance || 1000}
                className="bg-zinc-900 border border-white/10 rounded-xl px-4 w-32 focus:outline-none focus:border-green-500/50"
              />
              <button 
                onClick={deal}
                disabled={loading || !userData || userData.balance < betAmount}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'DEALING...' : 'DEAL HAND'}
              </button>
            </div>
          ) : (
            <div className="flex gap-3 w-full max-w-2xl">
              <button 
                onClick={hit}
                disabled={loading}
                className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 rounded-xl transition-all disabled:opacity-50"
              >
                HIT
              </button>
              <button 
                onClick={stand}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50"
              >
                STAND
              </button>
              {gameState.canDouble && (
                <button 
                  onClick={doubleDown}
                  disabled={loading || userData?.balance < betAmount}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50"
                >
                  DOUBLE
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};