import React from 'react';
import { Card } from './Card';
import { motion, AnimatePresence } from 'framer-motion';

export const PokerTable = ({ gameState, myPlayerId }) => {
    if (!gameState) return null;

    const { players, communityCards, pot, currentTurn, dealerIndex, winners } = gameState;

    // Helper to get seat position using geometry for a better ellipse distribution
    // We stick to fixed 6-max layout for simplicity
    const seatStyles = [
        { bottom: '-20px', left: '50%', transform: 'translate(-50%, 0)' }, // Hero (Bottom)
        { bottom: '20%', left: '-20px', transform: 'translate(0, 50%)' }, // Bottom Left
        { top: '20%', left: '-20px', transform: 'translate(0, -50%)' },   // Top Left
        { top: '-20px', left: '50%', transform: 'translate(-50%, 0)' },   // Top (Villain)
        { top: '20%', right: '-20px', transform: 'translate(0, -50%)' },  // Top Right
        { bottom: '20%', right: '-20px', transform: 'translate(0, 50%)' } // Bottom Right
    ];

    // Rotate players array so "me" is at index 0 (bottom)
    const myIndex = players.findIndex(p => p.id === myPlayerId);
    let displayPlayers = [...players];
    if (myIndex !== -1) {
        // Rotate so myIndex becomes 0
        const part1 = displayPlayers.slice(myIndex);
        const part2 = displayPlayers.slice(0, myIndex);
        displayPlayers = [...part1, ...part2];
    } else {
        // Spectator view: fill seeds? Or just keep original order
        // Keep original order but maybe center view?
    }

    return (
        <div className="relative w-full max-w-[900px] aspect-[16/9] md:aspect-[2/1] mx-auto my-12">
             {/* Table Structure */}
             <div className="absolute inset-0 rounded-[100px] border-[20px] border-[#2a1a1a] bg-[#0f0f0f] shadow-2xl overflow-visible">
                {/* Metallic Rim */}
                <div className="absolute inset-[-10px] rounded-[110px] border-4 border-yellow-900/40 shadow-inner pointer-events-none" />
                
                {/* Felt Gradient */}
                <div className="absolute inset-0 rounded-[80px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-800 via-green-900 to-black shadow-inner flex items-center justify-center">
                    
                    {/* Center Logo/Texture */}
                    <div className="absolute opacity-10 pointer-events-none select-none">
                        <span className="text-6xl md:text-8xl font-black text-black tracking-tighter">HOLD'EM</span>
                    </div>

                    {/* Community Cards Area */}
                    <div className="relative z-10 flex gap-2 md:gap-3 items-center justify-center h-24 md:h-32 px-6 rounded-2xl bg-black/20 border border-white/5 backdrop-blur-sm">
                        <AnimatePresence mode='popLayout'>
                            {communityCards.map((c, i) => (
                                <motion.div 
                                    key={`${i}-${c}`} // Use value as key for re-render on new games?
                                    initial={{ scale: 0.5, opacity: 0, y: -50, rotateX: 90 }} 
                                    animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }} 
                                    transition={{ type: "spring", bounce: 0.4, delay: i * 0.1 }}
                                >
                                    <Card card={c} className="w-12 h-16 md:w-16 md:h-24 shadow-2xl" />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        
                        {/* Placeholders */}
                        {Array(5 - communityCards.length).fill(0).map((_, i) => (
                            <div key={`ph-${i}`} className="w-12 h-16 md:w-16 md:h-24 rounded-lg border-2 border-dashed border-white/10 bg-white/5" />
                        ))}
                    </div>

                    {/* Pot Info */}
                    <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-10">
                        <div className="flex items-center gap-2 bg-black/60 px-4 py-1.5 rounded-full border border-yellow-500/20 shadow-lg backdrop-blur-md">
                            <span className="text-yellow-500 text-xs font-bold tracking-widest">POT</span>
                            <span className="text-white font-mono font-bold">${pot.toLocaleString()}</span>
                        </div>
                        
                        {/* Winner Announcement */}
                         <AnimatePresence>
                            {winners && winners.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute top-10 w-max bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.5)] border border-white/20 z-50 text-center"
                                >
                                    <div className="text-sm uppercase tracking-wider opacity-80 decoration-slice">Winner</div>
                                    <div className="text-lg">{winners.map(w => w.handDescription).join(', ')}</div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Players Layer (Outside Table) */}
            {displayPlayers.map((player, i) => {
                const isMe = player.id === myPlayerId;
                const isTurn = currentTurn === player.id;
                const isWinner = winners.some(w => w.playerId === player.id);
                // Cycle through positions based on how many players? No, stick to fixed slots for visual stability.
                // We mapped seeds above.
                const style = seatStyles[i];
                if (!style) return null; // Should limit to 6 players

                return (
                    <div 
                        key={player.id}
                        className="absolute flex flex-col items-center"
                        style={style}
                    >
                        {/* Dealer Button */}
                        {dealerIndex === player.seatIndex && (
                            <motion.div 
                                layoutId="dealer-button"
                                className="absolute -top-3 -right-3 z-30 w-8 h-8 bg-white rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.5)] flex items-center justify-center border-2 border-gray-300"
                            >
                                <span className="text-black font-black text-xs">D</span>
                            </motion.div>
                        )}

                        {/* Bet Bubble (Dynamic Position based on seat?) */}
                        {player.bet > 0 && (
                            <motion.div 
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                className="absolute -top-10 z-20 bg-yellow-500 text-black font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white/20"
                            >
                                ${player.bet}
                            </motion.div>
                        )}

                         {/* Cards */}
                         <div className="relative flex -space-x-8 mb-3 z-10 h-16 md:h-20 items-end">
                            {isMe && player.hand ? (
                                player.hand.map((c, idx) => (
                                    <motion.div 
                                        key={idx}
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: idx * 0.1 }}
                                        whileHover={{ y: -20, rotate: idx === 0 ? -5 : 5 }}
                                    >
                                        <Card card={c} className="w-14 h-20 md:w-16 md:h-24 shadow-2xl origin-bottom" />
                                    </motion.div>
                                ))
                            ) : (
                                player.hasCards && !player.folded ? (
                                    <>
                                        <div className="transform -rotate-6"><Card hidden className="w-10 h-14 md:w-12 md:h-16" /></div>
                                        <div className="transform rotate-6"><Card hidden className="w-10 h-14 md:w-12 md:h-16" /></div>
                                    </>
                                ) : null
                            )}
                        </div>

                        {/* Player Avatar/Stats */}
                        <div className={`
                            relative w-32 md:w-40 bg-[#1a1a1a] border transition-all duration-300 rounded-xl overflow-hidden shadow-xl
                            ${isTurn ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)] scale-105' : 'border-white/10'}
                            ${isWinner ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.6)] ring-2 ring-green-400' : ''}
                            ${player.folded ? 'opacity-50 grayscale scale-95' : ''}
                        `}>
                            {/* Progress Bar for Turn Timer (Optional) */}
                            {isTurn && (
                                <motion.div 
                                    className="absolute bottom-0 left-0 h-1 bg-yellow-500 z-10"
                                    initial={{ width: "100%" }}
                                    animate={{ width: "0%" }}
                                    transition={{ duration: 30, ease: "linear" }} // 30s turn timer assumption
                                />
                            )}

                            <div className="flex items-center gap-3 p-2">
                                {/* Avatar */}
                                <div className={`
                                    w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-inner
                                    ${isTurn ? 'bg-gradient-to-br from-yellow-600 to-yellow-800' : 'bg-gradient-to-br from-gray-700 to-gray-900'}
                                `}>
                                    {player.name?.substring(0, 2).toUpperCase()}
                                </div>

                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-xs font-bold text-white truncate">{player.name}</span>
                                    <span className="text-xs font-mono text-green-400">${player.balance.toLocaleString()}</span>
                                </div>
                            </div>
                            
                            {/* Status Overlay */}
                            {player.folded && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
                                    <span className="text-white/50 font-bold text-xs tracking-widest border border-white/20 px-2 py-0.5 rounded">FOLD</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
