const { pool } = require('../database/db');

class Listing {
    static async create(listingData) {
        const { user_id, title, description, price, category, condition, image_url } = listingData;

        const result = await pool.query(
            `INSERT INTO listings (user_id, title, description, price, category, condition, image_url) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [user_id, title, description, price, category, condition, image_url]
        );

        const row = result.rows[0];
        row.images = row.image_url ? (Array.isArray(row.image_url) ? row.image_url : (() => { try { return JSON.parse(row.image_url); } catch(e){ return []; }})()) : [];
        return row;
    }
    
    static async findAll() {
        const result = await pool.query(`
            SELECT l.*, u.name as seller_name 
            FROM listings l 
            JOIN users u ON l.user_id = u.id 
            WHERE l.status = 'active' 
            ORDER BY l.created_at DESC
        `);
        return result.rows;
    }
    
    static async findById(id) {
        const result = await pool.query(`
            SELECT l.*, u.name as seller_name, u.email as seller_email 
            FROM listings l 
            JOIN users u ON l.user_id = u.id 
            WHERE l.id = $1
        `, [id]);
        return result.rows[0];
    }
    
    static async findByUser(userId) {
        const result = await pool.query(
            'SELECT * FROM listings WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        return result.rows;
    }
    
    static async update(id, data) {
        const { title, description, price, category, condition } = data;
        
        const result = await pool.query(
            `UPDATE listings 
             SET title = $1, description = $2, price = $3, category = $4, condition = $5, updated_at = CURRENT_TIMESTAMP
             WHERE id = $6 RETURNING *`,
            [title, description, price, category, condition, id]
        );
        
        return result.rows[0];
    }
    
    static async delete(id) {
        await pool.query('DELETE FROM listings WHERE id = $1', [id]);
    }
    
    static async search(keyword) {
        const result = await pool.query(`
            SELECT l.*, u.name as seller_name 
            FROM listings l 
            JOIN users u ON l.user_id = u.id 
            WHERE l.status = 'active' AND (l.title ILIKE $1 OR l.description ILIKE $1)
            ORDER BY l.created_at DESC
        `, [`%${keyword}%`]);
        return result.rows;
    }
    
    static async incrementViews(id) {
        await pool.query('UPDATE listings SET view_count = view_count + 1 WHERE id = $1', [id]);
    }
}

module.exports = Listing;