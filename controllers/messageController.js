const { pool } = require('../database/db');
const Message = require('../models/Message');

const messageController = {
    // GET /messages — inbox
    getInbox: async (req, res) => {
        try {
            const messages = await Message.getInbox(req.session.user.id);
            res.render('pages/messages', {
                title: 'Messages',
                messages
            });
        } catch (err) {
            res.status(500).send('Error loading messages');
        }
    },

    // GET /messages/:listingId/:fromUserId — view a conversation thread
    getConversation: async (req, res) => {
        try {
            const { listingId, fromUserId } = req.params;
            const currentUserId = req.session.user.id;

            // Mark incoming messages in this thread as read
            await Message.markConversationRead(fromUserId, currentUserId, listingId);

            const messages = await Message.getConversation(currentUserId, fromUserId, listingId);

            // Fetch listing info for context
            const listingResult = await pool.query(
                'SELECT id, title, user_id FROM listings WHERE id = $1',
                [listingId]
            );
            const listing = listingResult.rows[0] || null;

            // Fetch the other user's name
            const otherUserResult = await pool.query(
                'SELECT id, name FROM users WHERE id = $1',
                [fromUserId]
            );
            const otherUser = otherUserResult.rows[0] || null;

            res.render('pages/conversation', {
                title: `Conversation about ${listing?.title || 'listing'}`,
                messages,
                listing,
                otherUser,
                listingId,
                fromUserId
            });
        } catch (err) {
            res.status(500).send('Error loading conversation');
        }
    },

    // POST /messages/send — send a message (from listing detail page)
    send: async (req, res) => {
        const { to_user_id, listing_id, message } = req.body;

        if (!message || message.trim().length === 0) {
            return res.redirect(`/listings/${listing_id}`);
        }

        try {
            await Message.send(req.session.user.id, to_user_id, listing_id, message.trim());
            res.redirect(`/messages/${listing_id}/${req.session.user.id}`);
        } catch (err) {
            res.status(500).send('Error sending message');
        }
    },

    // POST /messages/:listingId/:otherUserId/reply — reply within a thread
    reply: async (req, res) => {
        const { listingId, otherUserId } = req.params;
        const { message } = req.body;

        if (!message || message.trim().length === 0) {
            return res.redirect(`/messages/${listingId}/${otherUserId}`);
        }

        try {
            await Message.send(req.session.user.id, otherUserId, listingId, message.trim());
            res.redirect(`/messages/${listingId}/${otherUserId}`);
        } catch (err) {
            res.status(500).send('Error sending reply');
        }
    }
};

module.exports = messageController;