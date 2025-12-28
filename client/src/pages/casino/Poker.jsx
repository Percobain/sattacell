import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { PokerTable } from '../../components/poker/PokerTable';
import { PokerControls } from '../../components/poker/PokerControls';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { LoginButton } from "@/components/auth/LoginButton";
import logo from "/CodeCell Logo White.png";
import Dither from "@/components/ui/Dither";

export const Poker = () => {
    const { userData, isAuthenticated, refetchUserData } = useAuth();
    const [gameState, setGameState] = useState(null);
    const [joined, setJoined] = useState(false);
    const [privateHand, setPrivateHand] = useState([]);
    const [error, setError] = useState('');
    const [socket, setSocket] = useState(null);



    useEffect(() => {
        const skt = window.__sattacellSocket;
        if (!skt) return;
        setSocket(skt);

        const handleState = (state) => {
            console.log('Poker State:', state);
            setGameState(state);
            const isPlayer = state.players.some(p => p.id === userData?.firebaseUID);
            setJoined(isPlayer);
        };

        const handleHand = (data) => {
            console.log('My Hand:', data.hand);
            setPrivateHand(data.hand);
        };

        const handleError = (err) => {
            setError(err.message);
            setTimeout(() => setError(''), 3000);
        };

        skt.on('poker:state', handleState);
        skt.on('poker:hand', handleHand);
        skt.on('poker:error', handleError);

        return () => {
            skt.off('poker:state', handleState);
            skt.off('poker:hand', handleHand);
            skt.off('poker:error', handleError);
        };
    }, [userData]);

    // Refetch balance when joining or leaving table
    useEffect(() => {
        if (refetchUserData) {
            refetchUserData();
        }
    }, [joined, refetchUserData]);

    const handleJoin = () => {
        if (!socket || !userData) return;
        if (userData.balance < 1000) {
            setError('Insufficient funds to join table');
            setTimeout(() => setError(''), 3000);
            return;
        }
        socket.emit('poker:join', { 
            tableId: 'main-table', 
            user: { 
                id: userData.firebaseUID,
                name: userData.email?.split('@')[0],
                avatar: userData.photoURL
            },
            buyIn: 1000 
        });
    };

    const handleLeave = () => {
        if (!socket) return;
        socket.emit('poker:leave', { tableId: 'main-table' });

    };

    const handleAction = (action, amount = 0) => {
        if (!socket) return;
        socket.emit('poker:action', { 
            tableId: 'main-table', 
            action, 
            amount 
        });
    };

    const displayState = gameState ? {
        ...gameState,
        players: gameState.players.map(p => {
            if (p.id === userData?.firebaseUID) {
                return { ...p, hand: privateHand };
            }
            return p;
        })
    } : null;

    const myPlayer = displayState?.players.find(p => p.id === userData?.firebaseUID);
    const isMyTurn = displayState?.currentTurn === userData?.firebaseUID;

    return (
        <div className="min-h-screen relative flex flex-col items-center bg-[#050505] overflow-hidden">
             {/* Dynamic Background */}
             <div className="absolute inset-0 opacity-20 pointer-events-none">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(22,163,74,0.1),_transparent_70%)]" />
                 <Dither waveColor={[0, 0.2, 0]} disableAnimation={false} />
             </div>

             {/* Header */}
             <div className="w-full max-w-7xl relative z-20 p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-md rounded-2xl p-4 gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/casino" className="text-muted-foreground hover:text-white transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="flex items-center gap-2">
                             <img src={logo} alt="Logo" className="h-10 w-10 object-contain invert brightness-0" />
                             <div>
                                <h1 className="text-xl font-display font-bold text-white tracking-widest">TEXAS HOLD'EM</h1>
                                <p className="text-[10px] text-green-500 font-mono tracking-widest">LIVE PROTOCOL</p>
                             </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {joined && (
                            <Button
                                variant="destructive" 
                                size="sm"
                                onClick={handleLeave}
                                className="mr-4 bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-500/50"
                            >
                                SIT OUT
                            </Button>
                        )}
                        {isAuthenticated && (
                             <div className="hidden md:flex flex-col items-end mr-4">
                                 <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Balance</span>
                                 <span className="text-neon-green font-mono font-bold text-lg">¥ {userData?.balance?.toLocaleString()}</span>
                             </div>
                        )}
                        {isAuthenticated ? (
                             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]" title="Connected" />
                        ) : (
                            <LoginButton />
                        )}
                    </div>
                </div>
             </div>

            {/* Error Notification */}
            {error && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-8 py-4 rounded-xl shadow-2xl z-50 font-bold backdrop-blur-md border border-red-400/50 animate-in slide-in-from-top-4">
                    {error}
                </div>
            )}

            {/* Game Content */}
            <div className="relative z-10 w-full flex-1 flex flex-col justify-center items-center p-4">
                {!joined ? (
                    <div className="text-center space-y-8 animate-in zoom-in-95 duration-500">
                        <div className="space-y-2">
                            <h2 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/20 tracking-tighter">
                                HIGH STAKES
                            </h2>
                            <p className="text-xl text-green-500/80 font-mono tracking-widest">NO LIMIT HOLD'EM • ¥10/¥20</p>
                        </div>
                        
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                            <Button 
                                size="lg" 
                                className="relative text-xl px-16 py-8 bg-black border border-green-500/50 hover:bg-green-950/30 text-white rounded-2xl transition-all"
                                onClick={handleJoin}
                                disabled={!socket || !isAuthenticated || (userData?.balance < 1000)}
                            >
                                {!isAuthenticated ? 'LOGIN TO PLAY' : userData?.balance < 1000 ? 'INSUFFICIENT FUNDS' : 'SIT DOWN (¥1000)'}
                            </Button>
                        </div>
                        
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                            By joining, you agree to the Provably Fair protocol standards. Chips are deducted from your main wallet.
                        </p>
                    </div>
                ) : (
                    <>
                        <PokerTable 
                            gameState={displayState} 
                            myPlayerId={userData?.firebaseUID} 
                        />
                        
                        {/* Only show controls if it's my turn */}
                        {isMyTurn && myPlayer && (
                            <div className="animate-in slide-in-from-bottom-20 duration-300">
                                <PokerControls 
                                    onAction={handleAction} 
                                    currentBet={gameState.currentBet}
                                    userBalance={myPlayer.balance}
                                    userBet={myPlayer.bet}
                                />
                            </div>
                        )}
                        
                        {/* Waiting Indicator if entered but not seated/started? (handled by Table visuals) */}
                    </>
                )}
            </div>
            
            {/* Loading Overlay */}
            {!socket && (
                <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 backdrop-blur-3xl">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-green-500 blur-xl opacity-20 animate-pulse" />
                            <Loader2 className="animate-spin text-green-500 w-16 h-16 relative z-10" />
                        </div>
                        <p className="text-green-500/80 font-mono tracking-[0.2em] text-sm animate-pulse">ESTABLISHING UPLINK...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
