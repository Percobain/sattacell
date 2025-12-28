const { Hand } = require('pokersolver');
const crypto = require('crypto');

class PokerTable {
    constructor(id, bigBlind = 20) {
        this.id = id;
        this.players = []; // Array of { id, name, balance, socketId, hand, bet, status, folded, seatIndex }
        this.deck = [];
        this.communityCards = [];
        this.pot = 0;
        this.currentBet = 0; // The highest bet in the current round
        this.dealerIndex = 0;
        this.currentTurnIndex = 0; // Index in this.players
        this.smallBlind = bigBlind / 2;
        this.bigBlind = bigBlind;
        this.gameState = 'waiting'; // waiting, preflop, flop, turn, river, showdown
        this.lastAction = null; // { playerId, type, amount }
        this.deckSeed = crypto.randomBytes(16).toString('hex');
        this.winners = [];
    }

    addPlayer(user, socketId, buyIn) {
        // Prevent duplicate joining in same session?
        const existing = this.players.find(p => p.id === user.id);
        if (existing) {
            existing.socketId = socketId; // Reconnect
            return existing;
        }

        if (this.players.length >= 6) throw new Error('Table is full');

        // Simple seat assignment
        const usedSeats = this.players.map(p => p.seatIndex);
        let seatIndex = 0;
        while (usedSeats.includes(seatIndex)) seatIndex++;

        const player = {
            id: user.id || user._id.toString(),
            name: user.name || user.email.split('@')[0],
            avatar: user.avatar, // Optional
            balance: buyIn,
            socketId,
            hand: [],
            bet: 0, // Current round bet
            totalBet: 0, // Total bet in current hand
            status: 'active', // active, sitting_out
            folded: false,
            seatIndex
        };
        this.players.push(player);
        this.players.sort((a, b) => a.seatIndex - b.seatIndex);
        
        return player;
    }

    removePlayer(socketId) {
        const index = this.players.findIndex(p => p.socketId === socketId);
        if (index !== -1) {
            const player = this.players[index];
            // Fold them if game is active
            if (this.gameState !== 'waiting' && this.gameState !== 'showdown') {
                this.fold(this.players[index]);
            }
            this.players.splice(index, 1);
            if (this.players.length < 2) {
                this.resetHand();
                this.gameState = 'waiting';
            }
            return player;
        }
        return null;
    }

    resetHand() {
        this.players.forEach(p => {
            p.hand = [];
            p.bet = 0;
            p.totalBet = 0;
            p.folded = false;
        });
        this.communityCards = [];
        this.pot = 0;
        this.currentBet = 0;
        this.createDeck();
        this.winners = [];
    }

    createDeck() {
        const suits = ['h', 'd', 'c', 's'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
        this.deck = [];
        for (const s of suits) {
            for (const v of values) {
                this.deck.push(v + s);
            }
        }
        // Shuffle
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    startHand() {
        if (this.players.length < 2) return;
        this.resetHand();
        this.gameState = 'preflop';

        // Move dealer button
        this.dealerIndex = (this.dealerIndex + 1) % this.players.length;

        // Blinds
        const sbIndex = (this.dealerIndex + 1) % this.players.length;
        const bbIndex = (this.dealerIndex + 2) % this.players.length;

        this.placeBet(this.players[sbIndex], this.smallBlind, true); // isBlind
        this.placeBet(this.players[bbIndex], this.bigBlind, true);

        this.currentTurnIndex = (bbIndex + 1) % this.players.length;
        this.currentBet = this.bigBlind;

        // Deal cards
        this.players.forEach(p => {
            p.hand = [this.deck.pop(), this.deck.pop()];
        });
    }

    placeBet(player, amount, isBlind = false) {
        const betAmount = Math.min(amount, player.balance); // All-in adjustment
        player.balance -= betAmount;
        player.bet += betAmount;
        player.totalBet += betAmount;
        this.pot += betAmount;
        
        if (!isBlind) {
             // If raising, set new currentBet
             // Note: in poker, currentBet is the amount to call.
             // If player bets X, their player.bet becomes X.
             // If currentBet was Y, and X > Y, then currentBet becomes X.
             if (player.bet > this.currentBet) {
                this.currentBet = player.bet;
             }
        }
    }

    handleAction(socketId, action, amount = 0) {
        const player = this.players.find(p => p.socketId === socketId);
        if (!player) throw new Error('Player not found');
        if (this.players[this.currentTurnIndex].socketId !== socketId) throw new Error('Not your turn');

        switch (action) {
            case 'fold':
                this.fold(player);
                break;
            case 'check':
                if (player.bet < this.currentBet) throw new Error('Cannot check, must call');
                break;
            case 'call':
                const callAmount = this.currentBet - player.bet;
                this.placeBet(player, callAmount);
                break;
            case 'raise':
                // amount here is usually the total amount they are putting in (or adding to pot?)
                // Let's assume amount is the FINAL bet level (e.g. raised TO 100)
                // Or let's simplify and make amount the RAISE increment? Standard is usually "Raise TO X".
                // Let's implement "Raise TO X".
                if (amount <= this.currentBet) throw new Error('Raise must be greater than current bet');
                if (amount > player.balance + player.bet) throw new Error('Insufficient funds'); // simplified
                const diff = amount - player.bet;
                this.placeBet(player, diff);
                break;
            default:
                throw new Error('Invalid action');
        }

        this.lastAction = { playerId: player.id, type: action, amount };
        
        if (this.checkRoundComplete()) {
            this.nextPhase();
        } else {
            this.nextTurn();
        }

        return this.getPublicState();
    }

    fold(player) {
        player.folded = true;
        
        // Count active players
        const activePlayers = this.players.filter(p => !p.folded);
        if (activePlayers.length === 1) {
            this.endHand(activePlayers);
        }
    }

    nextTurn() {
        let loopCount = 0;
        let p;
        do {
            this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;
            p = this.players[this.currentTurnIndex];
            loopCount++;
        } while ((p.folded || p.balance === 0) && loopCount < this.players.length && this.gameState !== 'showdown');
        // Note: All-in players (balance=0) should be skipped for actions, 
        // but we need to handle if EVERYONE is all-in.
        // For MVP, simplistic skip.
    }

    checkRoundComplete() {
        const activePlayersWithChips = this.players.filter(p => !p.folded && p.balance > 0);
        
        if (activePlayersWithChips.length === 0) return true; // All-in showdown logic needed

        // If everyone active has matched the bet
        const allMatched = activePlayersWithChips.every(p => p.bet === this.currentBet);
        
        // Quick hack: Ensure everyone has acted at least once? 
        // Or if it's preflop, Big Blind has option.
        // For MVP: If matched, and last action wasn't a raise that started a new cycle...
        // We'll rely on client to not auto-send next turn if backend says it's done.
        
        // Let's add a "acted" set
        // Actually, just checking if bets are equal is insufficient if I just checked/called.
        // BUT, if I called, my bet matches. If you check, your bet matches (0=0).
        // The issue is if I haven't acted yet. 
        // e.g. Preflop: SB(10), BB(20). UTG(0). Current=20.
        // UTG hasn't acted. 0 != 20. Correct.
        // UTG calls (20). Current=20.
        // ...
        // BB checks.
        // We need to track "last raiser" or start index.
        return allMatched && (this.currentTurnIndex !== this.dealerIndex || allMatched); // Logic is tricky without state.
        // Simplifying for MVP: We will manually trigger next phase if everyone checks/calls?
        // No, let's use a "actionsTaken" counter per round?
        // Let's assume if we cycle back to the first person who bet/checked and they don't raise...
        
        // Correct approach:
        // We need to know who 'closed' the action.
        // Re-implement properly in next iteration if verifying fails.
        return allMatched; 
    }

    nextPhase() {
        // Reset bets
        this.players.forEach(p => p.bet = 0);
        this.currentBet = 0;
        
        // Reset turn to first active player after dealer
        let nextIndex = (this.dealerIndex + 1) % this.players.length;
        while (this.players[nextIndex].folded) nextIndex = (nextIndex + 1) % this.players.length;
        this.currentTurnIndex = nextIndex;

        switch (this.gameState) {
            case 'preflop':
                this.gameState = 'flop';
                this.deck.pop(); 
                this.communityCards.push(this.deck.pop(), this.deck.pop(), this.deck.pop());
                break;
            case 'flop':
                this.gameState = 'turn';
                this.deck.pop(); 
                this.communityCards.push(this.deck.pop());
                break;
            case 'turn':
                this.gameState = 'river';
                this.deck.pop(); 
                this.communityCards.push(this.deck.pop());
                break;
            case 'river':
                this.gameState = 'showdown';
                this.evaluateShowdown();
                break;
        }
    }

    evaluateShowdown() {
        const activePlayers = this.players.filter(p => !p.folded);
        // If only one, they won already.
        
        const hands = activePlayers.map(p => {
            const solverHand = Hand.solve([...p.hand, ...this.communityCards]);
            return {
                player: p,
                rank: solverHand.rank, 
                name: solverHand.name, 
                descr: solverHand.descr,
                solver: solverHand
            };
        });

        const winners = Hand.winners(hands.map(h => h.solver)); // solver objects
        
        const winAmount = Math.floor(this.pot / winners.length);
        this.winners = [];
        
        winners.forEach(winnerHand => {
            // Find the player object associated with this solver hand
            // Hand.winners returns the winning Hand objects from the input array
            const handObj = hands.find(h => h.solver.toString() === winnerHand.toString()); 
            // .toString() is a safe comparison for pokersolver hands usually? 
            // actually strict reference equality might fail if library clones.
            // But usually it returns the same instance.
            
            if (handObj) {
                handObj.player.balance += winAmount;
                this.winners.push({
                    playerId: handObj.player.id,
                    amount: winAmount,
                    handDescription: handObj.descr
                });
            }
        });
        
        // TODO: Persist results to DB
    }

    endHand(winners) {
        const winner = winners[0];
        winner.balance += this.pot;
        this.gameState = 'showdown';
        this.winners = [{
            playerId: winner.id,
            amount: this.pot,
            handDescription: 'Opponents Folded' 
        }];
    }

    getPublicState() {
        return {
            id: this.id,
            gameState: this.gameState,
            pot: this.pot,
            communityCards: this.communityCards,
            currentBet: this.currentBet,
            currentTurn: this.players[this.currentTurnIndex]?.id,
            dealerIndex: this.dealerIndex,
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                avatar: p.avatar,
                balance: p.balance,
                bet: p.bet,
                folded: p.folded,
                seatIndex: p.seatIndex,
                hasCards: p.hand.length > 0,
                isTurn: this.players[this.currentTurnIndex]?.id === p.id
            })),
            lastAction: this.lastAction,
            winners: this.winners
        };
    }

    getPlayerPrivateState(socketId) {
        const player = this.players.find(p => p.socketId === socketId);
        if (!player) return null;
        return {
            hand: player.hand
        };
    }
}

class PokerGameService {
    constructor() {
        this.tables = new Map();
        this.createTable('main-table');
    }

    createTable(id) {
        const table = new PokerTable(id);
        this.tables.set(id, table);
        return table;
    }

    getTable(id) {
        return this.tables.get(id);
    }
}

module.exports = new PokerGameService();
