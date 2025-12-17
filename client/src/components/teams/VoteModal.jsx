import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function VoteModal({ isOpen, onClose, team, currentVotes = 0, onVoteSuccess }) {
  const { userData, refetchUserData } = useAuth();
  const [amount, setAmount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setAmount(1);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const newTotalVotes = currentVotes + amount;
  const cost = Math.pow(newTotalVotes, 2) - Math.pow(currentVotes, 2);
  const canAfford = userData?.balance >= cost;

  const handleVote = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/teams/vote', {
        firebaseUID: userData.firebaseUID,
        teamId: team._id,
        amount: amount
      });

      if (response.success) {
        await refetchUserData(); // Update balance
        onVoteSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to vote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-card border border-primary/30 p-6 shadow-2xl shadow-primary/10">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-primary/50 hover:text-primary transition-colors"
        >
          ✕
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-neon-green font-mono text-xs">[VOTE]</span>
            <h2 className="text-xl font-display font-bold text-primary">{team.name}</h2>
          </div>
          <p className="text-sm text-muted-foreground font-mono">
           Current Team Votes: <span className="text-foreground">{team.voteCount}</span> | Your Votes: <span className="text-foreground">{currentVotes}</span>
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-primary/5 p-4 border border-primary/10">
            <label className="block text-xs font-mono text-primary mb-2">VOTES TO ADD</label>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setAmount(Math.max(1, amount - 1))}
                className="h-8 w-8 border-primary/30"
              >
                -
              </Button>
              <div className="flex-1 text-center font-display text-2xl text-foreground">
                {amount}
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setAmount(amount + 1)}
                className="h-8 w-8 border-primary/30"
              >
                +
              </Button>
            </div>
          </div>

          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Current Total (You)</span>
              <span>{currentVotes}</span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span>New Total (You)</span>
              <span className="text-foreground">{newTotalVotes}</span>
            </div>
             <div className="h-px bg-primary/20 my-2"></div>
            <div className="flex justify-between items-center text-neon-red">
              <span>COST calculation</span>
              <span>{newTotalVotes}² - {currentVotes}²</span>
            </div>
            <div className="flex justify-between items-center text-xl font-bold">
              <span className="text-primary">TOTAL COST</span>
              <span className={canAfford ? 'text-neon-green' : 'text-neon-red'}>
                {cost} Tokens
              </span>
            </div>
            <div className="flex justify-between items-center text-xs mt-1">
              <span className="text-muted-foreground">Your Balance</span>
              <span className={canAfford ? 'text-muted-foreground' : 'text-neon-red'}>
                {userData?.balance?.toFixed(2)}
              </span>
            </div>
          </div>
          
          {error && (
            <div className="text-neon-red text-xs font-mono bg-neon-red/10 p-2 border border-neon-red/20">
              [ERROR] {error}
            </div>
          )}

          <Button 
            className="w-full font-mono font-bold tracking-wider"
            variant={canAfford ? "neon" : "ghost"}
            disabled={!canAfford || loading}
            onClick={handleVote}
          >
            {loading ? 'PROCESSING...' : canAfford ? 'CONFIRM VOTE' : 'INSUFFICIENT FUNDS'}
          </Button>
        </div>
      </div>
    </div>
  );
}
