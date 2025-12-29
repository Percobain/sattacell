import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
// import { Slider } from "@/components/ui/slider";

export const PokerControls = ({ onAction, currentBet, userBalance, userBet }) => {
    const minRaise = currentBet > 0 ? currentBet * 2 : 20; // Simplified min raise rule
    const [raiseAmount, setRaiseAmount] = useState(minRaise);
    
    // Calculate call amount
    const callAmount = currentBet - userBet;

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-2xl bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3 md:p-4 shadow-2xl z-50 flex flex-col gap-3">
            
            {/* Top Row: Main Actions */}
            <div className="flex items-center gap-3 w-full">
                <Button 
                    variant="outline" 
                    className="flex-1 h-12 text-base font-bold border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                    onClick={() => onAction('fold')}
                >
                    FOLD
                </Button>
                
                <Button 
                    className="flex-[2] h-12 text-base font-bold bg-yellow-500 hover:bg-yellow-400 text-black transition-all"
                    onClick={() => onAction(callAmount === 0 ? 'check' : 'call')}
                >
                    {callAmount === 0 ? 'CHECK' : `CALL ${callAmount}`}
                </Button>
            </div>

            {/* Bottom Row: Raise Controls (Compact) */}
            <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl">
                 <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 text-xs text-muted-foreground hover:text-white"
                    onClick={() => setRaiseAmount(minRaise)}
                >
                    MIN
                </Button>
                
                <input
                    type="range"
                    min={minRaise}
                    max={userBalance + userBet}
                    step={10}
                    value={raiseAmount}
                    onChange={(e) => setRaiseAmount(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-500"
                />
                
                <span className="text-green-400 font-mono font-bold text-sm min-w-[60px] text-right">
                    ¥{raiseAmount}
                </span>

                <Button 
                    size="sm"
                    className="h-8 px-4 font-bold bg-green-600 hover:bg-green-500 text-white shadow-lg ml-2"
                    onClick={() => onAction('raise', raiseAmount)}
                >
                    RAISE
                </Button>
            </div>
        </div>
    );
};
