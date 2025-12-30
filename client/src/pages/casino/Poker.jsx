import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { PokerTable } from '../../components/poker/PokerTable';
import { PokerControls } from '../../components/poker/PokerControls';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Copy } from 'lucide-react';
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
    const [joinCode, setJoinCode] = useState('');
    
    // Routing
    const { shortCode } = useParams();
    const navigate = useNavigate();

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
            // If error joining private room, maybe redirect to lobby?
        };

        const handleJoined = ({ tableId }) => {
            if (tableId !== 'main-table') {
                navigate(`/casino/poker/${tableId}`);
            }
        };

        skt.on('poker:state', handleState);
        skt.on('poker:hand', handleHand);
        skt.on('poker:error', handleError);
        skt.on('poker:joined', handleJoined);

        return () => {
            skt.off('poker:state', handleState);
            skt.off('poker:hand', handleHand);
            skt.off('poker:error', handleError);
            skt.off('poker:joined', handleJoined);
        };
    }, [userData, navigate]);

    // Auto-join if shortCode exists and socket ready
    useEffect(() => {
        if (shortCode && socket && userData && !joined) {
             // Attempt to join specific table
             handleJoin(shortCode);
        }
    }, [shortCode, socket, userData, joined]);

    // Refetch balance when joining or leaving table
    useEffect(() => {
        if (refetchUserData) {
            refetchUserData();
        }
    }, [joined, refetchUserData]);

    const handleJoin = (tableId = 'main-table') => {
        if (!socket || !userData) return;
        if (userData.balance < 1000) {
            setError('Insufficient funds to join table');
            setTimeout(() => setError(''), 3000);
            return;
        }
        socket.emit('poker:join', { 
            tableId, 
            user: { 
                id: userData.firebaseUID,
                name: userData.email?.split('@')[0],
                avatar: userData.photoURL
            },
            buyIn: 1000 
        });
    };

    const handleCreatePrivate = () => {
        if (!socket || !userData) return;
        if (userData.balance < 1000) {
            setError('Insufficient funds');
            return;
        }
        socket.emit('poker:create_private', {
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
        // If we are in a private room, leave that specific one?
        // The socket handler looks up by socket.id so argument might be ignored but good to pass.
        // Actually handler takes { tableId }
        const currentTableId = gameState?.id || 'main-table';
        socket.emit('poker:leave', { tableId: currentTableId });
        navigate('/casino/poker'); // Return to lobby
    };

    const handleAction = (action, amount = 0) => {
        if (!socket) return;
        socket.emit('poker:action', { 
            tableId: gameState?.id, 
            action, 
            amount 
        });
    };

    const handleStartGame = () => {
        if (!socket || !gameState) return;
        socket.emit('poker:start_game', { tableId: gameState.id });
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
    const isOwner = displayState?.ownerId === userData?.firebaseUID;
    const showStartButton = isOwner && displayState?.isPrivate && !displayState?.hasStarted && displayState?.players.length >= 2;

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
                                LEAVE TABLE
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
            <div className="relative z-10 w-full flex-1 flex flex-col justify-center items-center p-4 pb-32 md:pb-24">
                {!joined && !shortCode ? (
                    <div className="text-center space-y-8 animate-in zoom-in-95 duration-500 w-full max-w-4xl">
                        <div className="space-y-2">
                            <h2 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/20 tracking-tighter">
                                HIGH STAKES
                            </h2>
                            <p className="text-xl text-green-500/80 font-mono tracking-widest">NO LIMIT HOLD'EM • ¥10/¥20</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                            {/* Public Table */}
                            <div className="relative group p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-green-500/50 transition-all">
                                <h3 className="text-2xl font-bold text-white mb-4">PUBLIC TABLE</h3>
                                <p className="text-muted-foreground mb-6 h-12">Join the main table and play with anyone currently online.</p>
                                <Button 
                                    size="lg" 
                                    className="w-full text-lg py-6 bg-green-600 hover:bg-green-700 text-white rounded-xl"
                                    onClick={() => handleJoin('main-table')}
                                    disabled={!socket || !isAuthenticated || (userData?.balance < 1000)}
                                >
                                    JOIN PUBLIC
                                </Button>
                            </div>

                            {/* Private Table */}
                            <div className="relative group p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all">
                                <h3 className="text-2xl font-bold text-white mb-4">PRIVATE ROOM</h3>
                                <div className="space-y-4">
                                    <Button 
                                        size="lg" 
                                        className="w-full text-lg py-6 bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
                                        onClick={handleCreatePrivate}
                                        disabled={!socket || !isAuthenticated || (userData?.balance < 1000)}
                                    >
                                        CREATE ROOM
                                    </Button>
                                    
                                    <div className="flex gap-2">
                                        <Input 
                                            placeholder="Enter Room Code" 
                                            className="bg-black/50 border-white/20 text-center font-mono uppercase"
                                            value={joinCode}
                                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                            maxLength={6}
                                        />
                                        <Button 
                                            variant="outline"
                                            className="border-white/20 hover:bg-white/10"
                                            onClick={() => handleJoin(joinCode)}
                                            disabled={!joinCode || joinCode.length < 6}
                                        >
                                            JOIN
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-8">
                            By joining, you agree to the Provably Fair protocol standards. Chips are deducted from your main wallet.
                        </p>
                    </div>
                ) : (
                    <>
                         {/* Room Info / Start Button */}
                         {gameState?.isPrivate && (
                            <div className="absolute top-24 right-4 z-40 flex flex-col items-end gap-2 animate-in slide-in-from-right">
                                <div className="flex flex-col bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10">
                                    <span className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Room Code</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-mono font-bold text-purple-400 tracking-widest select-all">
                                            {gameState.id}
                                        </span>
                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-8 w-8 hover:bg-white/10"
                                            onClick={() => navigator.clipboard.writeText(window.location.href)}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {showStartButton && (
                                    <Button 
                                        size="lg" 
                                        className="w-full bg-green-500 hover:bg-green-600 text-black font-bold animate-pulse text-lg shadow-[0_0_20px_rgba(34,197,94,0.6)]"
                                        onClick={handleStartGame}
                                    >
                                        START GAME
                                    </Button>
                                )}
                                
                                {gameState.isPrivate && !gameState.hasStarted && !isOwner && (
                                    <div className="bg-yellow-500/20 text-yellow-500 px-4 py-2 rounded-lg border border-yellow-500/50 backdrop-blur-md">
                                        Waiting for host to start...
                                    </div>
                                )}
                            </div>
                        )}

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
