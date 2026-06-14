const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');

function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
}

// GET /saved - Show saved listings
router.get('/', requireLogin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT l.*, u.name as seller_name 
            FROM saved_listings s
            JOIN listings l ON s.listing_id = l.id
            JOIN users u ON l.user_id = u.id
            WHERE s.user_id = $1 AND l.status = 'active'
            ORDER BY s.saved_at DESC
        `, [req.session.user.id]);
        
        res.render('pages/saved-listings', {
            title: 'Saved Listings',
            listings: result.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading saved listings');
    }
});

// POST /saved/toggle/:id - Save or unsave a listing
router.post('/toggle/:id', requireLogin, async (req, res) => {
    const listingId = req.params.id;
    
    try {
        // Check if already saved
        const check = await pool.query(
            'SELECT 1 FROM saved_listings WHERE user_id = $1 AND listing_id = $2',
            [req.session.user.id, listingId]
        );
        
        if (check.rows.length > 0) {
            // Unsave
            await pool.query(
                'DELETE FROM saved_listings WHERE user_id = $1 AND listing_id = $2',
                [req.session.user.id, listingId]
            );
            res.json({ saved: false });
        } else {
            // Save
            await pool.query(
                'INSERT INTO saved_listings (user_id, listing_id) VALUES ($1, $2)',
                [req.session.user.id, listingId]
            );
            res.json({ saved: true });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to toggle save' });
    }
});

module.exports = router;