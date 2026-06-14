const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');

// Browse all listings
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

// Search
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
            params.push(parseFloat(minPrice));
            idx++;
        }
        
        if (maxPrice) {
            query += ` AND l.price <= $${idx}`;
            params.push(parseFloat(maxPrice));
            idx++;
        }
        
        if (condition && condition !== 'all') {
            query += ` AND l.condition = $${idx}`;
            params.push(condition);
            idx++;
        }
        
        query += ` ORDER BY l.created_at DESC`;
        
        const result = await pool.query(query, params);
        
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

// Get single listing by ID
router.get('/:id', async (req, res) => {
    try {
        const listingId = req.params.id;
        
        // Increment view count
        await pool.query('UPDATE listings SET view_count = view_count + 1 WHERE id = $1', [listingId]);
        
        // Get listing with seller info
        const result = await pool.query(`
            SELECT l.*, u.name as seller_name, u.email as seller_email, u.student_id
            FROM listings l 
            JOIN users u ON l.user_id = u.id 
            WHERE l.id = $1 AND l.status = 'active'
        `, [listingId]);
        
        if (result.rows.length === 0) {
            return res.status(404).render('pages/404', { 
                title: 'Listing Not Found',
                message: 'The listing you are looking for does not exist or has been removed.'
            });
        }
        
        const listing = result.rows[0];
        
        res.render('pages/listing-detail', { 
            title: listing.title,
            listing: listing
        });
    } catch (err) {
        console.error('Error loading listing:', err);
        res.status(500).render('pages/500', { 
            title: 'Server Error',
            message: 'Something went wrong while loading the listing.'
        });
    }
});

module.exports = router;