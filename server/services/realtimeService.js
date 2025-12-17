const Market = require('../models/Market');
const { calculateProbabilities } = require('./lmsrService');

/**
 * Initialize MongoDB Change Streams for real-time updates
 * @param {Server} io - Socket.io instance
 */
function initRealtimeService(io) {
    console.log('Initializing Realtime Service with Change Streams...');

    const changeStream = Market.watch([
        {
            $match: {
                $or: [
                    { operationType: 'update' },
                    { operationType: 'replace' }
                ]
            }
        },
        {
            $project: {
                'fullDocument.description': 0, // Optimize: Don't fetch/transmit large description
                'fullDocument.createdBy': 0,
                'fullDocument.createdAt': 0,
                'fullDocument.updatedAt': 0,
                'fullDocument.__v': 0
            }
        }
    ], { fullDocument: 'updateLookup' });

    changeStream.on('change', async (change) => {
        try {
            const market = change.fullDocument;

            // We only care if relevant fields changed (q or b or status)
            // Note: 'updateDescription' might not be available in all simple replace ops,
            // but typically for $set it is.
            if (change.operationType === 'update' && change.updateDescription) {
                const updatedFields = change.updateDescription.updatedFields;
                const relevantFields = ['q', 'b', 'status', 'outcomes'];
                const hasRelevantChange = Object.keys(updatedFields).some(key =>
                    relevantFields.some(field => key.startsWith(field))
                );

                if (!hasRelevantChange) return;
            }

            // Calculate new probabilities
            const probabilities = calculateProbabilities(market.q, market.b);

            const updatePayload = {
                _id: market._id,
                probabilities,
                status: market.status,
                // Calculate minimal delta if needed, but sending full prob array is small enough
                // and safer for consistency.
            };

            // Broadcast to all clients
            io.emit('market:update', updatePayload);

            // Also emit specific event for this market for potential room-based usage later
            io.emit(`market:${market._id}:update`, updatePayload);

        } catch (error) {
            console.error('Error processing change stream event:', error);
        }
    });

    changeStream.on('error', (error) => {
        console.error('Change Stream error:', error);
    });

    return changeStream;
}

module.exports = {
    initRealtimeService
};
