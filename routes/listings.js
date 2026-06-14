const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');

// Browse all listings (FIXED - includes sidebar variables)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT l.*, u.name as seller_name 
            FROM listings l 
            JOIN users u ON l.user_id = u.id 
            WHERE l.status = 'active' 
            ORDER BY l.created_at DESC
        `);
        
        res.render('pages/listings', { 
            title: 'Browse Listings',
            listings: result.rows,
            // These are needed for the sidebar partial
            searchQuery: '',
            selectedCategory: 'all',
            minPrice: '',
            maxPrice: '',
            selectedCondition: 'all'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading listings');
    }
});

// Search results (already has these variables)
router.get('/search', async (req, res) => {
    const { q, category, minPrice, maxPrice, condition } = req.query;
    
    try {
        let query = `
            SELECT l.*, u.name as seller_name 
            FROM listings l 
            JOIN users u ON l.user_id = u.id 
            WHERE l.status = 'active'
        `;
        const params = [];
        let idx = 1;
        
        if (q) {
            query += ` AND (l.title ILIKE $${idx} OR l.description ILIKE $${idx})`;
            params.push(`%${q}%`);
            idx++;
        }
        
        if (category && category !== 'all') {
            query += ` AND l.category = $${idx}`;
            params.push(category);
            idx++;
        }
        
        if (minPrice) {
            query += ` AND l.price >= $${idx}`;
            params.push(minPrice);
            idx++;
        }
        
        if (maxPrice) {
            query += ` AND l.price <= $${idx}`;
            params.push(maxPrice);
            idx++;
        }
        
        if (condition && condition !== 'all') {
            query += ` AND l.condition = $${idx}`;
            params.push(condition);
            idx++;
        }
        
        query += ` ORDER BY l.created_at DESC`;
        
        const result = await pool.query(query, params);
        
        // Get categories for filter dropdown
        const categories = await pool.query('SELECT DISTINCT category FROM listings WHERE status = $1', ['active']);
        
        res.render('pages/listings', { 
            title: q ? `Search: ${q}` : 'Search Results',
            listings: result.rows,
            searchQuery: q || '',
            selectedCategory: category || 'all',
            minPrice: minPrice || '',
            maxPrice: maxPrice || '',
            selectedCondition: condition || 'all'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error performing search');
    }
});

// Single listing view
router.get('/:id', async (req, res) => {
    try {
        await pool.query('UPDATE listings SET view_count = view_count + 1 WHERE id = $1', [req.params.id]);
        
        const result = await pool.query(`
            SELECT l.*, u.name as seller_name, u.email as seller_email 
            FROM listings l 
            JOIN users u ON l.user_id = u.id 
            WHERE l.id = $1
        `, [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).send('Listing not found');
        }
        
        res.render('pages/listing-detail', { 
            title: result.rows[0].title,
            listing: result.rows[0] 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading listing');
    }
});

module.exports = router;