import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Rocket, Box, Disc, Coins, Dices, Gamepad2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import logo from "/CodeCell Logo White.png";
import { LoginButton } from "@/components/auth/LoginButton";
import { useAuth } from "@/hooks/useAuth";

const games = [
  { id: 'mines', name: 'Mines', icon: <Box className="w-8 h-8" />, color: 'from-yellow-400 to-orange-500', desc: 'Uncover gems, avoid bombs.' },
  { id: 'plinko', name: 'Plinko', icon: <Disc className="w-8 h-8" />, color: 'from-pink-500 to-rose-500', desc: 'Drop the ball and win multipliers.' },
  { id: 'dice', name: 'Dice', icon: <Dices className="w-8 h-8" />, color: 'from-blue-400 to-indigo-500', desc: 'Roll over or under.' },
  { id: 'roulette', name: 'Roulette', icon: <Disc className="w-8 h-8 animate-spin-slow" />, color: 'from-red-500 to-red-600', desc: 'Spin the wheel.' },
  { id: 'blackjack', name: 'Blackjack', icon: <Gamepad2 className="w-8 h-8" />, color: 'from-green-500 to-emerald-600', desc: 'Beat the dealer to 21.' },
  { id: 'coinflip', name: 'Coin Flip', icon: <Coins className="w-8 h-8" />, color: 'from-yellow-300 to-yellow-500', desc: 'Double or nothing.' },
  { id: 'poker', name: 'Poker', icon: <Box className="w-8 h-8" />, color: 'from-indigo-500 to-purple-600', desc: 'Texas Hold\'em PvP.' },
];

export const CasinoPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, userData } = useAuth();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
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
          {isAuthenticated && (
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
      <div className="hidden md:flex justify-between items-center text-xs font-mono text-muted-foreground border-y border-primary/20 py-2">
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

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="mb-12 text-center"
        >
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
            CASINO LOUNGE
          </h1>
          <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.05, rotate: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/casino/${game.id}`)}
              className="group relative cursor-pointer"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-10 group-hover:opacity-20 rounded-2xl blur-xl transition-all duration-500`} />
              <div className="relative h-full bg-card/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl overflow-hidden hover:border-white/20 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${game.color} text-white shadow-lg`}>
                    {game.icon}
                  </div>
                  <Rocket className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity -rotate-45" />
                </div>
                
                <h3 className="text-2xl font-bold mb-2">{game.name}</h3>
                <p className="text-muted-foreground text-sm">{game.desc}</p>
                
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
