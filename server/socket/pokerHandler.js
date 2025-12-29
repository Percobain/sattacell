const pokerService = require('../services/pokerGameService');
const User = require('../models/User');

module.exports = (io) => {
    // For simplicity with existing client, let's use the main io but prefix events
    io.on('connection', (socket) => {

        socket.on('poker:create_private', async ({ user, buyIn = 1000 }) => {
            try {
                 // Verify user and balance
                 const dbUser = await User.findOne({ firebaseUID: user.id });
                 if (!dbUser) throw new Error('User not found');
                 if (dbUser.balance < buyIn) throw new Error('Insufficient balance');

                 // Create private table
                 const table = pokerService.createPrivateTable(user.id);
                 
                 // Deduct buy-in
                 dbUser.balance -= buyIn;
                 await dbUser.save();

                 // Add player to table
                 const player = table.addPlayer(user, socket.id, buyIn);

                 socket.join(`poker:${table.id}`);

                 // Emit success with tableId
                 socket.emit('poker:joined', { tableId: table.id });

                 // Emit full state
                 io.to(`poker:${table.id}`).emit('poker:state', table.getPublicState());
                 socket.emit('poker:hand', table.getPlayerPrivateState(socket.id));

            } catch (error) {
                socket.emit('poker:error', { message: error.message });
            }
        });
        
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

                // If tableId is not provided or is 'main-table', treat as public
                const targetTableId = tableId || 'main-table';
                let table = pokerService.getTable(targetTableId);
                
                if (!table) {
                    if (targetTableId === 'main-table') {
                        table = pokerService.createTable('main-table');
                    } else {
                        throw new Error('Table not found');
                    }
                }

                // Deduct buy-in (atomic operation preferred, but save() is okay for MVP)
                dbUser.balance -= buyIn;
                await dbUser.save();
                
                const player = table.addPlayer(user, socket.id, buyIn);
                
                socket.join(`poker:${table.id}`);
                
                // Emit joined event so client knows they are in
                socket.emit('poker:joined', { tableId: table.id });

                // Emit full state to everyone in room
                io.to(`poker:${table.id}`).emit('poker:state', table.getPublicState());
                
                // Emit private state (hand) to the player
                if (player) {
                    socket.emit('poker:hand', table.getPlayerPrivateState(socket.id));
                }

                // If enough players, start countdown?
                // Only for public tables. Private tables wait for owner.
                if (!table.isPrivate && table.players.length >= 2 && table.gameState === 'waiting') {
                    setTimeout(() => {
                         if (table.gameState === 'waiting' && table.players.length >= 2) {
                             table.startHand();
                             io.to(`poker:${table.id}`).emit('poker:state', table.getPublicState());
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

        socket.on('poker:start_game', ({ tableId }) => {
            try {
                const table = pokerService.getTable(tableId);
                if (!table) throw new Error('Table not found');
                
                // Verify owner
                const player = table.players.find(p => p.socketId === socket.id);
                if (!player || table.ownerId !== player.id) {
                    throw new Error('Only the owner can start the game');
                }

                if (table.players.length < 2) throw new Error('Need at least 2 players to start');

                table.startHand();
                io.to(`poker:${table.id}`).emit('poker:state', table.getPublicState());
                table.players.forEach(p => {
                     io.to(p.socketId).emit('poker:hand', { hand: p.hand });
                });

            } catch (error) {
                socket.emit('poker:error', { message: error.message });
            }
        });

        socket.on('poker:action', ({ tableId, action, amount }) => {
            try {
                const table = pokerService.getTable(tableId);
                if (!table) throw new Error('Table not found');

                table.handleAction(socket.id, action, amount);
                
                io.to(`poker:${table.id}`).emit('poker:state', table.getPublicState());
                
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
                            io.to(`poker:${table.id}`).emit('poker:state', table.getPublicState());
                            table.players.forEach(p => {
                                 io.to(p.socketId).emit('poker:hand', { hand: p.hand });
                            });
                        } else {
                            // Reset to waiting
                            table.resetHand();
                            table.gameState = 'waiting';
                            table.hasStarted = false; // Reset started status
                            io.to(`poker:${table.id}`).emit('poker:state', table.getPublicState());
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
                        io.to(`poker:${table.id}`).emit('poker:state', table.getPublicState());
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
