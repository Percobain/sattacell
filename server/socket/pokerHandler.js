const pokerService = require('../services/pokerGameService');
const User = require('../models/User');

module.exports = (io) => {
    // For simplicity with existing client, let's use the main io but prefix events
    io.on('connection', (socket) => {
        
        socket.on('poker:join', async ({ tableId, user, buyIn = 1000 }) => {
            try {
                // Verify user and balance
                const dbUser = await User.findOne({ firebaseUID: user.id });
                if (!dbUser) {
                    throw new Error('User not found');
                }

                if (dbUser.balance < buyIn) {
                    throw new Error('Insufficient balance');
                }

                // Deduct buy-in (atomic operation preferred, but save() is okay for MVP)
                dbUser.balance -= buyIn;
                await dbUser.save();

                const table = pokerService.getTable(tableId) || pokerService.createTable(tableId);
                
                const player = table.addPlayer(user, socket.id, buyIn);
                
                socket.join(`poker:${tableId}`);
                
                // Emit full state to everyone in room
                io.to(`poker:${tableId}`).emit('poker:state', table.getPublicState());
                
                // Emit private state (hand) to the player
                if (player) {
                    socket.emit('poker:hand', table.getPlayerPrivateState(socket.id));
                }

                // If enough players, maybe start countdown?
                if (table.players.length >= 2 && table.gameState === 'waiting') {
                    setTimeout(() => {
                         if (table.gameState === 'waiting' && table.players.length >= 2) {
                             table.startHand();
                             io.to(`poker:${tableId}`).emit('poker:state', table.getPublicState());
                             // Send hands to everyone
                             table.players.forEach(p => {
                                 io.to(p.socketId).emit('poker:hand', { hand: p.hand });
                             });
                         }
                    }, 2000);
                }

            } catch (error) {
                socket.emit('poker:error', { message: error.message });
            }
        });

        socket.on('poker:action', ({ tableId, action, amount }) => {
            try {
                const table = pokerService.getTable(tableId);
                if (!table) throw new Error('Table not found');

                table.handleAction(socket.id, action, amount);
                
                io.to(`poker:${tableId}`).emit('poker:state', table.getPublicState());
                
                // If showdown happened, state includes winners.
                if (table.gameState === 'showdown') {
                    // Update winners' balances in DB (TODO: Move to service or handle here)
                    // Note: This only handles the "winning" pot. 
                    // To keep DB in sync, we ideally update balances after every hand or strictly on cashout.
                    // For "Cash Game" style, updating on cashout is safer/easier, 
                    // BUT we need to ensure if server crashes, money isn't lost.
                    // Implementation Plan decision: "Refund/Update... when leaving". 
                    // So we rely on the in-memory balance until they leave.

                    setTimeout(() => {
                        // Check if players valid
                        if (table.players.length >= 2) {
                            table.startHand();
                            io.to(`poker:${tableId}`).emit('poker:state', table.getPublicState());
                            table.players.forEach(p => {
                                 io.to(p.socketId).emit('poker:hand', { hand: p.hand });
                            });
                        } else {
                            // Reset to waiting
                            table.resetHand();
                            table.gameState = 'waiting';
                            io.to(`poker:${tableId}`).emit('poker:state', table.getPublicState());
                        }
                    }, 5000); // 5 seconds to see winners
                }

            } catch (error) {
                socket.emit('poker:error', { message: error.message });
            }
        });

        socket.on('poker:leave', async ({ tableId }) => {
            try {
                const table = pokerService.getTable(tableId);
                if (table) {
                    const player = table.removePlayer(socket.id);
                    if (player) {
                        // Refund balance to DB
                        const dbUser = await User.findOne({ firebaseUID: player.id });
                        if (dbUser) {
                            dbUser.balance += player.balance;
                            await dbUser.save();
                        }
                        io.to(`poker:${tableId}`).emit('poker:state', table.getPublicState());
                    }
                }
            } catch (error) {
                console.error('Poker leave error:', error);
            }
        });

        socket.on('disconnect', async () => {
             // Find which table they were in
             for (const table of pokerService.tables.values()) {
                 const player = table.removePlayer(socket.id);
                 if (player) {
                     // Refund balance to DB
                     const dbUser = await User.findOne({ firebaseUID: player.id });
                     if (dbUser) {
                         dbUser.balance += player.balance;
                         await dbUser.save();
                     }
                     io.to(`poker:${table.id}`).emit('poker:state', table.getPublicState());
                     return;
                 }
             }
        });
    });
};
