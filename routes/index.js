const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');

// Home page
router.get('/', async (req, res) => {
    try {
        const listings = await pool.query(`
            SELECT l.*, u.name as seller_name 
            FROM listings l 
            JOIN users u ON l.user_id = u.id 
            WHERE l.status = 'active' 
            ORDER BY l.created_at DESC 
            LIMIT 12
        `);
        
        res.render('pages/index', { 
            title: 'Home', 
            listings: listings.rows 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading listings');
    }
});

// About page
router.get('/about', (req, res) => {
    res.render('pages/about', { title: 'About ACT Marketplace' });
});

// Contact page
router.get('/contact', (req, res) => {
    res.render('pages/contact', { title: 'Contact Us' });
});

module.exports = router;