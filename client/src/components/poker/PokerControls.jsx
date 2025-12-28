import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
// import { Slider } from "@/components/ui/slider";

export const PokerControls = ({ onAction, currentBet, userBalance, userBet }) => {
    const minRaise = currentBet > 0 ? currentBet * 2 : 20; // Simplified min raise rule
    const [raiseAmount, setRaiseAmount] = useState(minRaise);
    
    // Calculate call amount
    const callAmount = currentBet - userBet;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-3xl bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 shadow-2xl z-50 flex flex-col md:flex-row items-center gap-6">
            
            {/* Action Group: Fold/Check/Call */}
            <div className="flex gap-4 w-full md:w-auto">
                <Button 
                    variant="outline" 
                    className="flex-1 md:w-32 h-14 text-lg font-bold border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                    onClick={() => onAction('fold')}
                >
                    FOLD
                </Button>
                
                <Button 
                    className="flex-1 md:w-32 h-14 text-lg font-bold bg-yellow-500 hover:bg-yellow-400 text-black transition-all shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:shadow-[0_0_20px_rgba(234,179,8,0.5)]"
                    onClick={() => onAction(callAmount === 0 ? 'check' : 'call')}
                >
                    {callAmount === 0 ? 'CHECK' : `CALL ¥${callAmount}`}
                </Button>
            </div>

            <div className="w-px h-12 bg-white/10 hidden md:block" />

            {/* Raise Controls */}
            <div className="flex flex-col gap-3 w-full">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground uppercase">
                    <span>Raise Amount</span>
                    <span className="text-green-400 font-bold text-base">¥{raiseAmount}</span>
                </div>
                
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min={minRaise}
                        max={userBalance + userBet}
                        step={10}
                        value={raiseAmount}
                        onChange={(e) => setRaiseAmount(Number(e.target.value))}
                        className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-500 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(34,197,94,0.8)]"
                    />
                    
                    <Button 
                        className="w-32 h-14 font-black text-lg bg-green-600 hover:bg-green-500 text-white shadow-[0_0_20px_rgba(22,163,74,0.3)] hover:shadow-[0_0_30px_rgba(22,163,74,0.6)] transition-all"
                        onClick={() => onAction('raise', raiseAmount)}
                    >
                        RAISE
                    </Button>
                </div>
                
                {/* Quick select buttons */}
                <div className="flex justify-between gap-2">
                    {[
                        { label: 'MIN', val: minRaise },
                        { label: 'POT', val: minRaise * 1.5 }, // Simplified logic
                        { label: 'ALL IN', val: userBalance + userBet }
                    ].map((opt) => (
                        <button 
                            key={opt.label}
                            onClick={() => setRaiseAmount(Math.min(Math.floor(opt.val), userBalance + userBet))}
                            className="bg-white/5 hover:bg-white/10 text-[10px] text-muted-foreground hover:text-white px-2 py-1 rounded border border-white/5 transition-colors"
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
