const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const { requireLogin } = require('../middleware/auth');

// View own profile
router.get('/', requireLogin, async (req, res) => {
    try {
        const userResult = await pool.query(
            'SELECT id, name, email, student_id, created_at FROM users WHERE id = $1',
            [req.session.user.id]
        );
        
        const listingsResult = await pool.query(
            'SELECT * FROM listings WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC',
            [req.session.user.id, 'active']
        );
        
        const countResult = await pool.query(
            'SELECT COUNT(*) FROM listings WHERE user_id = $1',
            [req.session.user.id]
        );
        
        res.render('pages/profile', {
            title: 'My Profile',
            profileUser: userResult.rows[0],
            listings: listingsResult.rows,
            listingCount: parseInt(countResult.rows[0].count),
            isOwnProfile: true
        });
    } catch (err) {
        res.status(500).send('Error loading profile');
    }
});

// View other user's profile
router.get('/:id', async (req, res) => {
    try {
        const userResult = await pool.query(
            'SELECT id, name, email, student_id, created_at FROM users WHERE id = $1',
            [req.params.id]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(404).send('User not found');
        }
        
        const listingsResult = await pool.query(
            'SELECT * FROM listings WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC',
            [req.params.id, 'active']
        );
        
        const countResult = await pool.query(
            'SELECT COUNT(*) FROM listings WHERE user_id = $1',
            [req.params.id]
        );
        
        const isOwnProfile = req.session.user && req.session.user.id == req.params.id;
        
        res.render('pages/profile', {
            title: `${userResult.rows[0].name}'s Profile`,
            profileUser: userResult.rows[0],
            listings: listingsResult.rows,
            listingCount: parseInt(countResult.rows[0].count),
            isOwnProfile: isOwnProfile
        });
    } catch (err) {
        res.status(500).send('Error loading profile');
    }
});

module.exports = router;