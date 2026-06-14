const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');

// Middleware to check if logged in
function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
}

// GET /messages - Show inbox
router.get('/', requireLogin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                m.*,
                CASE 
                    WHEN m.from_user_id = $1 THEN u_to.name
                    ELSE u_from.name
                END as other_user_name,
                CASE 
                    WHEN m.from_user_id = $1 THEN m.to_user_id
                    ELSE m.from_user_id
                END as other_user_id,
                l.title as listing_title,
                l.id as listing_id
            FROM messages m
            JOIN users u_from ON m.from_user_id = u_from.id
            JOIN users u_to ON m.to_user_id = u_to.id
            LEFT JOIN listings l ON m.listing_id = l.id
            WHERE m.from_user_id = $1 OR m.to_user_id = $1
            ORDER BY m.created_at DESC
        `, [req.session.user.id]);
        
        // Get unique conversations
        const conversations = [];
        const seenUsers = new Set();
        
        for (const msg of result.rows) {
            if (!seenUsers.has(msg.other_user_id)) {
                seenUsers.add(msg.other_user_id);
                conversations.push({
                    other_user_id: msg.other_user_id,
                    other_user_name: msg.other_user_name,
                    last_message: msg.message,
                    last_message_time: msg.created_at,
                    listing_title: msg.listing_title,
                    is_read: msg.is_read
                });
            }
        }
        
        res.render('pages/messages', {
            title: 'Messages',
            conversations: conversations,
            user: req.session.user
        });
    } catch (err) {
        console.error('Inbox Error:', err);
        res.status(500).send('Error loading messages: ' + err.message);
    }
});

// GET /messages/conversation/:userId - Show conversation with specific user
router.get('/conversation/:userId', requireLogin, async (req, res) => {
    try {
        const otherUserId = parseInt(req.params.userId);
        const currentUserId = req.session.user.id;
        
        if (isNaN(otherUserId)) {
            return res.status(400).send('Invalid user ID');
        }
        
        // Get other user info
        const userResult = await pool.query(
            'SELECT id, name, email FROM users WHERE id = $1',
            [otherUserId]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(404).send('User not found');
        }
        
        // Mark unread messages as read
        await pool.query(`
            UPDATE messages 
            SET is_read = true 
            WHERE from_user_id = $1 AND to_user_id = $2 AND is_read = false
        `, [otherUserId, currentUserId]);
        
        // Get conversation between users
        const messagesResult = await pool.query(`
            SELECT m.*, 
                   u_from.name as from_user_name,
                   u_to.name as to_user_name,
                   l.title as listing_title
            FROM messages m
            JOIN users u_from ON m.from_user_id = u_from.id
            JOIN users u_to ON m.to_user_id = u_to.id
            LEFT JOIN listings l ON m.listing_id = l.id
            WHERE (m.from_user_id = $1 AND m.to_user_id = $2)
               OR (m.from_user_id = $2 AND m.to_user_id = $1)
            ORDER BY m.created_at ASC
        `, [currentUserId, otherUserId]);
        
        res.render('pages/conversation', {
            title: `Conversation with ${userResult.rows[0].name}`,
            otherUser: userResult.rows[0],
            otherUserId: otherUserId,
            messages: messagesResult.rows,
            currentUser: req.session.user
        });
    } catch (err) {
        console.error('Conversation Error:', err);
        res.status(500).send('Error loading conversation: ' + err.message);
    }
});

// POST /messages/send - Send a new message
router.post('/send', requireLogin, async (req, res) => {
    const { to_user_id, listing_id, message } = req.body;
    const from_user_id = req.session.user.id;
    
    if (!message || message.trim() === '') {
        return res.status(400).send('Message cannot be empty');
    }
    
    if (!to_user_id) {
        return res.status(400).send('Receiver is required');
    }
    
    try {
        const result = await pool.query(
            `INSERT INTO messages (from_user_id, to_user_id, listing_id, message, created_at, is_read) 
             VALUES ($1, $2, $3, $4, NOW(), false)
             RETURNING *`,
            [from_user_id, to_user_id, listing_id || null, message.trim()]
        );
        
        // Check if it's an AJAX request
        if (req.xhr || req.headers.accept === 'application/json') {
            res.json({ success: true, message: result.rows[0] });
        } else {
            res.redirect(`/messages/conversation/${to_user_id}`);
        }
    } catch (err) {
        console.error('Send Message Error:', err);
        if (req.xhr || req.headers.accept === 'application/json') {
            res.status(500).json({ success: false, error: err.message });
        } else {
            res.status(500).send('Error sending message: ' + err.message);
        }
    }
});

// POST /messages/mark-read/:id - Mark a single message as read
router.post('/mark-read/:id', requireLogin, async (req, res) => {
    try {
        await pool.query(
            'UPDATE messages SET is_read = true WHERE id = $1 AND to_user_id = $2',
            [req.params.id, req.session.user.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Mark Read Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /messages/unread-count - Get unread message count (for navbar badge)
router.get('/unread-count', requireLogin, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT COUNT(*) FROM messages WHERE to_user_id = $1 AND is_read = false',
            [req.session.user.id]
        );
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (err) {
        console.error('Unread Count Error:', err);
        res.status(500).json({ count: 0 });
    }
});

// DELETE /messages/:id - Delete a message (optional)
router.delete('/:id', requireLogin, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM messages WHERE id = $1 AND (from_user_id = $2 OR to_user_id = $2)',
            [req.params.id, req.session.user.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Delete Message Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;