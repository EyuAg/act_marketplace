const { pool } = require('./db');

// User queries
const UserQueries = {
    create: (name, email, studentId, hashedPassword) => 
        pool.query('INSERT INTO users (name, email, student_id, password) VALUES ($1, $2, $3, $4) RETURNING id', [name, email, studentId, hashedPassword]),
    
    findByEmail: (email) => 
        pool.query('SELECT * FROM users WHERE email = $1', [email]),
    
    findById: (id) => 
        pool.query('SELECT id, name, email, student_id, role, created_at FROM users WHERE id = $1', [id]),
    
    updateRole: (userId, role) => 
        pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, userId]),
    
    delete: (userId) => 
        pool.query('DELETE FROM users WHERE id = $1', [userId]),
    
    getAll: () => 
        pool.query('SELECT id, name, email, student_id, role, created_at FROM users ORDER BY created_at DESC')
};

// Listing queries
const ListingQueries = {
    create: (userId, title, description, price, category, condition, imageUrl) =>
        pool.query('INSERT INTO listings (user_id, title, description, price, category, condition, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id', [userId, title, description, price, category, condition, imageUrl]),
    
    findAll: () =>
        pool.query('SELECT l.*, u.name as seller_name FROM listings l JOIN users u ON l.user_id = u.id WHERE l.status = $1 ORDER BY l.created_at DESC', ['active']),
    
    findById: (id) =>
        pool.query('SELECT l.*, u.name as seller_name, u.email as seller_email FROM listings l JOIN users u ON l.user_id = u.id WHERE l.id = $1', [id]),
    
    findByUser: (userId) =>
        pool.query('SELECT * FROM listings WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
    
    update: (id, userId, title, description, price, category, condition) =>
        pool.query('UPDATE listings SET title = $1, description = $2, price = $3, category = $4, condition = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 AND user_id = $7', [title, description, price, category, condition, id, userId]),
    
    delete: (id, userId) =>
        pool.query('DELETE FROM listings WHERE id = $1 AND user_id = $2', [id, userId]),
    
    search: (keyword) =>
        pool.query('SELECT l.*, u.name as seller_name FROM listings l JOIN users u ON l.user_id = u.id WHERE l.status = $1 AND (l.title ILIKE $2 OR l.description ILIKE $2) ORDER BY l.created_at DESC', ['active', `%${keyword}%`]),
    
    incrementView: (id) =>
        pool.query('UPDATE listings SET view_count = view_count + 1 WHERE id = $1', [id])
};

// Saved listings queries
const SavedQueries = {
    save: (userId, listingId) =>
        pool.query('INSERT INTO saved_listings (user_id, listing_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, listingId]),
    
    unsave: (userId, listingId) =>
        pool.query('DELETE FROM saved_listings WHERE user_id = $1 AND listing_id = $2', [userId, listingId]),
    
    getUserSaved: (userId) =>
        pool.query('SELECT l.*, u.name as seller_name FROM saved_listings s JOIN listings l ON s.listing_id = l.id JOIN users u ON l.user_id = u.id WHERE s.user_id = $1 ORDER BY s.saved_at DESC', [userId]),
    
    isSaved: (userId, listingId) =>
        pool.query('SELECT 1 FROM saved_listings WHERE user_id = $1 AND listing_id = $2', [userId, listingId])
};

// Message queries
const MessageQueries = {
    send: (fromUserId, toUserId, listingId, message) =>
        pool.query('INSERT INTO messages (from_user_id, to_user_id, listing_id, message) VALUES ($1, $2, $3, $4) RETURNING id', [fromUserId, toUserId, listingId, message]),
    
    getConversation: (user1Id, user2Id, listingId) =>
        pool.query('SELECT * FROM messages WHERE ((from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $2 AND to_user_id = $1)) AND listing_id = $3 ORDER BY created_at ASC', [user1Id, user2Id, listingId]),
    
    getUserMessages: (userId) =>
        pool.query('SELECT m.*, u.name as sender_name, l.title as listing_title FROM messages m JOIN users u ON m.from_user_id = u.id JOIN listings l ON m.listing_id = l.id WHERE m.to_user_id = $1 ORDER BY m.created_at DESC', [userId]),
    
    markAsRead: (messageId) =>
        pool.query('UPDATE messages SET is_read = true WHERE id = $1', [messageId]),
    
    getUnreadCount: (userId) =>
        pool.query('SELECT COUNT(*) FROM messages WHERE to_user_id = $1 AND is_read = false', [userId])
};

module.exports = { UserQueries, ListingQueries, SavedQueries, MessageQueries };