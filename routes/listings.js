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
        const listings = result.rows.map(r => ({
            ...r,
            images: r.image_url ? (Array.isArray(r.image_url) ? r.image_url : (() => { try { return JSON.parse(r.image_url); } catch(e){ return []; }})()) : []
        }));

        res.render('pages/listings', { 
            title: 'Browse Listings',
            listings
        });
    } catch (err) {
        res.status(500).send('Error loading listings');
    }
});

// Search
router.get('/search', async (req, res) => {
    const { q, category, minPrice, maxPrice } = req.query;
    
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
        
        query += ` ORDER BY l.created_at DESC`;
        
        const result = await pool.query(query, params);
        const listings = result.rows.map(r => ({
            ...r,
            images: r.image_url ? (Array.isArray(r.image_url) ? r.image_url : (() => { try { return JSON.parse(r.image_url); } catch(e){ return []; }})()) : []
        }));

        res.render('pages/listings', { 
            title: q ? `Search: ${q}` : 'Search Results',
            listings
        });
    } catch (err) {
        res.status(500).send('Error performing search');
    }
});

// Single listing
router.get('/:id', async (req, res) => {
    const listingId = parseInt(req.params.id, 10);
    if (Number.isNaN(listingId)) {
        return res.status(404).render('pages/404', { title: 'Page Not Found', message: 'Listing not found.' });
    }

    try {
        // Track views when the column exists; older local databases may not have it yet.
        await pool.query(`
            UPDATE listings
            SET view_count = COALESCE(view_count, 0) + 1
            WHERE id = $1
        `, [listingId]).catch((err) => {
            if (err.code !== '42703') throw err;
            console.warn('Skipping view count update: listings.view_count column is missing');
        });
        
        const result = await pool.query(`
            SELECT l.*, u.name as seller_name, u.email as seller_email 
            FROM listings l 
            JOIN users u ON l.user_id = u.id 
            WHERE l.id = $1
        `, [listingId]);
        
        if (result.rows.length === 0) {
            return res.status(404).render('pages/404', { title: 'Listing Not Found', message: 'The requested listing does not exist.' });
        }
        
        const listing = result.rows[0];
        listing.images = listing.image_url ? (Array.isArray(listing.image_url) ? listing.image_url : (() => { try { return JSON.parse(listing.image_url); } catch(e){ return []; }})()) : [];

        res.render('pages/listing-detail', { 
            title: listing.title,
            listing
        });
    } catch (err) {
        console.error('Listing error:', err);
        res.status(500).render('pages/error', { title: 'Error', status: 500, message: 'Error loading listing', error: process.env.NODE_ENV === 'development' ? err : {} });
    }
});

module.exports = router;
