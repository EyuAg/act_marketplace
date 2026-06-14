const { pool } = require('../database/db');

class Message {
    static async send(fromUserId, toUserId, listingId, message) {
        const result = await pool.query(
            'INSERT INTO messages (from_user_id, to_user_id, listing_id, message) VALUES ($1, $2, $3, $4) RETURNING *',
            [fromUserId, toUserId, listingId, message]
        );
        return result.rows[0];
    }

    static async getConversation(user1Id, user2Id, listingId) {
        const result = await pool.query(`
            SELECT m.*, u.name as sender_name
            FROM messages m
            JOIN users u ON m.from_user_id = u.id
            WHERE ((m.from_user_id = $1 AND m.to_user_id = $2) OR (m.from_user_id = $2 AND m.to_user_id = $1))
              AND m.listing_id = $3
            ORDER BY m.created_at ASC
        `, [user1Id, user2Id, listingId]);
        return result.rows;
    }

    static async getInbox(userId) {
        const result = await pool.query(`
            SELECT DISTINCT ON (m.from_user_id, m.listing_id)
                m.*, u.name as sender_name, l.title as listing_title
            FROM messages m
            JOIN users u ON m.from_user_id = u.id
            JOIN listings l ON m.listing_id = l.id
            WHERE m.to_user_id = $1
            ORDER BY m.from_user_id, m.listing_id, m.created_at DESC
        `, [userId]);
        return result.rows;
    }

    static async markAsRead(messageId) {
        await pool.query('UPDATE messages SET is_read = true WHERE id = $1', [messageId]);
    }

    static async markConversationRead(fromUserId, toUserId, listingId) {
        await pool.query(
            'UPDATE messages SET is_read = true WHERE from_user_id = $1 AND to_user_id = $2 AND listing_id = $3',
            [fromUserId, toUserId, listingId]
        );
    }

    static async getUnreadCount(userId) {
        const result = await pool.query(
            'SELECT COUNT(*) FROM messages WHERE to_user_id = $1 AND is_read = false',
            [userId]
        );
        return parseInt(result.rows[0].count);
    }
}

module.exports = Message;