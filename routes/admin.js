const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const { requireAdmin } = require('../middleware/auth');

// Admin dashboard
router.get('/', requireAdmin, async (req, res) => {
    try {
        const userCount = await pool.query('SELECT COUNT(*) FROM users');
        const listingCount = await pool.query('SELECT COUNT(*) FROM listings');
        const recentUsers = await pool.query('SELECT * FROM users ORDER BY created_at DESC LIMIT 10');
        const recentListings = await pool.query(`
            SELECT l.*, u.name as seller_name 
            FROM listings l 
            JOIN users u ON l.user_id = u.id 
            ORDER BY l.created_at DESC 
            LIMIT 10
        `);
        
        res.render('pages/admin/dashboard', {
            title: 'Admin Dashboard',
            userCount: parseInt(userCount.rows[0].count),
            listingCount: parseInt(listingCount.rows[0].count),
            recentUsers: recentUsers.rows,
            recentListings: recentListings.rows
        });
    } catch (err) {
        res.status(500).send('Error loading admin panel');
    }
});

// Manage users
router.get('/users', requireAdmin, async (req, res) => {
    try {
        const users = await pool.query('SELECT id, name, email, student_id, role, created_at FROM users ORDER BY created_at DESC');
        res.render('pages/admin/users', {
            title: 'Manage Users',
            users: users.rows
        });
    } catch (err) {
        res.status(500).send('Error loading users');
    }
});

// Make user admin
router.get('/make-admin/:id', requireAdmin, async (req, res) => {
    try {
        await pool.query('UPDATE users SET role = $1 WHERE id = $2', ['admin', req.params.id]);
        res.redirect('/admin/users');
    } catch (err) {
        res.status(500).send('Error updating user');
    }
});

// Delete user
router.get('/delete-user/:id', requireAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.redirect('/admin/users');
    } catch (err) {
        res.status(500).send('Error deleting user');
    }
});

// Delete any listing
router.get('/delete-listing/:id', requireAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM listings WHERE id = $1', [req.params.id]);
        res.redirect('/admin');
    } catch (err) {
        res.status(500).send('Error deleting listing');
    }
});

module.exports = router;